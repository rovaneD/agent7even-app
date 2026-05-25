import { createServiceClient } from '@/lib/supabase/server'

export async function getNotifyEmail(): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'notify_email')
    .single()
  return (data?.value as string) ?? process.env.NOTIFY_EMAIL ?? 'admin@agent7even.com'
}
