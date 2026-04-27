'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      // 로그인 성공 후 이동할 페이지
      router.replace('/')
      // 또는 router.replace('/mypage')
    })
  }, [router])

  return <p>로그인 처리 중...</p>
}
