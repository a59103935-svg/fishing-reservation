'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function KakaoCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let attempts = 0

    async function tryRedirect() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        if (attempts < 5) {
          attempts++
          setTimeout(tryRedirect, 500)
        } else {
          router.replace('/login')
        }
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', session.user.id)
        .maybeSingle()

      router.replace(profile?.nickname ? '/' : '/set-nickname')
    }

    tryRedirect()
  }, [])

  return (
    <div style={{ background: '#0D1F35', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}
