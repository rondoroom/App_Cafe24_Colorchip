const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// 챕터 7에서 Render Environment Variables에 등록한 값들을 읽어옴
const CLIENT_ID = process.env.CAFE24_CLIENT_ID;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const REDIRECT_URI = process.env.CAFE24_REDIRECT_URI;

// ===========================================================
// 1. 기본 페이지 (서버가 살아있는지 확인용)
// ===========================================================
app.get('/', (req, res) => {
  res.send('색상칩 앱 서버가 정상적으로 동작 중입니다.');
});

// ===========================================================
// 2. 카페24 OAuth 콜백 주소
// 카페24가 인증코드(code)와 쇼핑몰 정보(mall_id)를 보내주면,
// 그걸로 Access Token을 발급받음
// ===========================================================
app.get('/auth/callback', async (req, res) => {
  const { code, mall_id } = req.query;

  console.log('=== 카페24에서 도착한 정보 ===');
  console.log('인증코드(code):', code);
  console.log('쇼핑몰 ID(mall_id):', mall_id);

  if (!code || !mall_id) {
    return res.status(400).send('필수 정보(code 또는 mall_id)가 없습니다.');
  }

  try {
    // 토큰 발급 주소는 쇼핑몰마다 다름 (mall_id가 주소에 포함됨)
    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;

    // Client ID + Client Secret을 "id:secret" 형태로 합친 뒤 Base64로 변환
    // -> 이게 "이 앱이 진짜 우리가 만든 앱"이라는 증명서 역할
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('=== Access Token 발급 성공 ===');
    console.log('access_token:', response.data.access_token);
    console.log('refresh_token:', response.data.refresh_token);
    console.log('만료시간(expires_at):', response.data.expires_at);

    // TODO (챕터 9에서 추가할 작업):
    // 위에서 받은 access_token, refresh_token을 콘솔에만 출력하는 대신
    // Supabase의 shops 테이블에 저장하는 코드를 여기에 추가

    res.send('인증이 완료되었습니다! 이 창은 닫으셔도 됩니다.');
  } catch (error) {
    console.error('=== Token 발급 실패 ===');
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send('인증 처리 중 오류가 발생했습니다.');
  }
});

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
