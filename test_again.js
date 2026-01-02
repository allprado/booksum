
const md5 = '799f73aec3c7199f76b020c5ffe96ecc';
const rapidKey = '5b02950f3fmshebd59fd3c6c7941p1c0af1jsn450cbe689d30';
const rapidHost = 'annas-archive-api.p.rapidapi.com';

async function testAgain() {
    const url = `https://${rapidHost}/download?md5=${md5}`;

    console.log('Testing 799f... again');
    try {
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': rapidKey,
                'x-rapidapi-host': rapidHost
            }
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Error:', error);
    }
}

testAgain();
