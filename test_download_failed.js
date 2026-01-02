
const md5 = '799f73aec3c7199f76b020c5ffe96ecc';
const rapidKey = '5b02950f3fmshebd59fd3c6c7941p1c0af1jsn450cbe689d30';

async function testDownload() {
    const url = `https://annas-archive-api.p.rapidapi.com/download?md5=${md5}`;

    console.log('Testing URL:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': 'annas-archive-api.p.rapidapi.com'
            }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Download data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testDownload();
