'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

async function checkAndRedirect(supabase: ReturnType<typeof createClient>, router: ReturnType<typeof useRouter>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.replace('/'); return }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  router.replace(profile ? '/' : '/set-nickname')
}

export default function KakaoCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        checkAndRedirect(supabase, router)
      }
    })

    const timer = setTimeout(() => {
      subscription.unsubscribe()
      checkAndRedirect(supabase, router)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div style={{ background: '#0D1F35', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}
