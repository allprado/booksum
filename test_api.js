
const query = 'Paulo Coelho';
const rapidKey = '5b02950f3fmshebd59fd3c6c7941p1c0af1jsn450cbe689d30';

async function testSearch() {
    const url = `https://annas-archive-api.p.rapidapi.com/search?q=${encodeURIComponent(query)}&cat=fiction%2C%20nonfiction%2C%20comic%2C%20magazine%2C%20musicalscore%2C%20other%2C%20unknown&page=1&ext=pdf%2C%20epub%2C%20mobi%2C%20azw3&source=libgenLi%2C%20libgenRs`;

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
        console.log('Data keys:', Object.keys(data));
        if (data.books && data.books.length > 0) {
            console.log('Books count:', data.books.length);
            console.log('First book keys:', Object.keys(data.books[0]));
            console.log('First book fields:', JSON.stringify(data.books[0], null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testSearch();
