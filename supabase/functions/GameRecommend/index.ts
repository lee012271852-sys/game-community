import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { mode, selections, userInput, isRetry } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const rawgKey = Deno.env.get('RAWG_API_KEY')

    if (!openAiKey || !rawgKey) throw new Error("API keys missing.")
    const openai = new OpenAI({ apiKey: openAiKey })

    const strategy = isRetry 
      ? `[다양성 모드]: 평점보다는 유저의 '5가지 조건'에 얼마나 완벽히 부합하는지를 최우선으로 검토하십시오. 대중적인 인기작이나 숨겨진 보석 중 조건 일치도가 90% 이상인 게임만 선정하십시오.`
      : `[정석 모드]: 검증된 고평점 명작 중 유저의 '5가지 조건'을 단 하나도 어기지 않는 최적의 게임 5개를 선정하십시오.`;

    const guideline = `
      - 유저의 선택(플레이타임, 난이도, 경험, 사회적, 비주얼)과 하나라도 정면으로 충돌하는 게임은 절대 추천하지 마십시오.
      - '도트/픽셀' + '사실적': 현대적 연출(HD-2D 등)이 가미된 정교한 아트워크의 게임을 선정하십시오.
    `;

    let searchPrompt = mode === 'logic' 
      ? `${strategy}
      조건: 플레이타임(${selections.playTime}), 난이도(${selections.energy}), 경험(${selections.emotion}), 사회적(${selections.social}), 비주얼(${selections.aesthetic})
      지침: ${guideline}
      - 반드시 실존하는 게임의 정확한 영문 제목만 출력하십시오.`
      : `"${userInput}"에 완벽히 부합하며 조건 충돌이 없는 실존 게임 5개를 추천하십시오.`;

    const searchCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "결과는 JSON { \"games\": [\"Exact Title\", ...] } 형식으로만 답하십시오." },
        { role: "user", content: searchPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: isRetry ? 1.1 : 0.5,
      presence_penalty: isRetry ? 1.5 : 0.3,
    })

    const recommendedNames = JSON.parse(searchCompletion.choices[0].message.content!).games

    const finalRecommendations = await Promise.all(
      recommendedNames.slice(0, 5).map(async (name: string) => {
        try {
          const searchRes = await fetch(`https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(name)}&page_size=1`)
          const searchData = await searchRes.json()
          const gameBase = searchData.results?.[0]
          if (!gameBase) return null;

          const [detailRes, storesRes] = await Promise.all([
            fetch(`https://api.rawg.io/api/games/${gameBase.id}?key=${rawgKey}`),
            fetch(`https://api.rawg.io/api/games/${gameBase.id}/stores?key=${rawgKey}`)
          ]);
          
          const detailData = await detailRes.json();
          const storesData = await storesRes.json();

          const priority = [1, 6, 11, 2, 3];
          let directLink = "";
          for (const id of priority) {
            const found = storesData.results?.find((s: any) => s.store_id === id);
            if (found) { directLink = found.url; break; }
          }

          // [수정 포인트] 추천 사유 생성 프롬프트 강화
          const reviewRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { 
                role: "system", 
                content: `당신은 게임의 예술성과 메커니즘을 통달한 전문 비평가입니다. 
                추천 사유를 작성할 때 다음 원칙을 지키십시오:
                1. '좋아하실 겁니다' 같은 뻔한 문구는 지양하고, 게임의 독보적인 강점과 유저의 선택 조건이 어떻게 맞물리는지 구체적으로 서술하십시오.
                2. 첫 문장은 게임의 정체성을 관통하는 강렬한 문장으로 시작하십시오.
                3. 난이도, 아트 스타일, 경험적 가치 중 가장 돋보이는 부분을 강조하여 3문장 이내의 정중하고 지적인 한국어로 작성하십시오.` 
              },
              { role: "user", content: `게임명: ${gameBase.name}, 유저가 선택한 조건들: ${JSON.stringify(selections)}` }
            ]
          })

          return {
            id: gameBase.id,
            title: gameBase.name,
            image_url: gameBase.background_image || "",
            metacritic: gameBase.metacritic,
            reason: reviewRes.choices[0].message.content,
            purchase_url: directLink || detailData.website || `https://rawg.io/games/${gameBase.slug}`
          }
        } catch { return null }
      })
    )

    return new Response(JSON.stringify({ recommendations: finalRecommendations.filter(g => g !== null) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})