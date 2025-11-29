// script/supabase.js
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;

// 🔻 여기를 수정했습니다! (SUPABASE_KEY -> SUPABASE_SERVICE_KEY)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env 파일에서 Supabase URL과 KEY를 찾을 수 없습니다.');
  // 디버깅용: 실제로 뭘 읽었는지 확인 (보안상 실제 키는 안 보여주는 게 좋지만, 로컬이니까 확인)
  console.log('읽어온 URL:', supabaseUrl);
  console.log('읽어온 KEY:', supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;