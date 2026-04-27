// script/supabase.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// 1. 환경변수 로드 (상위 폴더 우선순위)
// game-api 폴더에서 실행하므로 ../.env.local을 바라봐야 함
const envResult = dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// 2. 로드된 모든 환경변수 중에서 'SUPABASE'가 들어간 것들을 출력해봄 (디버깅용)
console.log('---------------------------------------------------');
console.log('🔍 로드된 환경변수 확인 (보안을 위해 일부만 표시)');
const allKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));

if (allKeys.length === 0) {
  console.log('   ❌ SUPABASE 관련 변수가 하나도 없습니다. .env 파일 내용을 확인하세요.');
} else {
  allKeys.forEach(key => {
    const val = process.env[key];
    const hiddenVal = val ? val.substring(0, 10) + '...' : '비어있음';
    console.log(`   👉 [${key}]: ${hiddenVal}`);
  });
}
console.log('---------------------------------------------------');

// 3. 유연하게 변수 찾기 (이름이 뭐든 간에 찾아내기)
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey = 
  process.env.SUPABASE_SERVICE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_KEY; // 혹시 몰라 이것도 추가

// 4. 결과 판정
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 오류: URL이나 KEY를 결정할 수 없습니다.');
  console.error('   위의 목록에 키가 없다면 .env.local 파일 저장이 안 되었거나 오타가 있는 것입니다.');
  process.exit(1);
}

console.log('✅ Supabase 클라이언트 연결 성공!');
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;