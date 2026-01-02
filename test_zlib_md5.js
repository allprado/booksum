
const md5 = '1da5c9731dd495d0d68e50c45721c273';
const rapidKey = '5b02950f3fmshebd59fd3c6c7941p1c0af1jsn450cbe689d30';
const rapidHost = 'annas-archive-api.p.rapidapi.com';

async function testZlibMd5() {
    const url = `https://${rapidHost}/download?md5=${md5}`;

    console.log('Testing Zlib-style MD5...');
    try {
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': rapidHost
            }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testZlibMd5();
