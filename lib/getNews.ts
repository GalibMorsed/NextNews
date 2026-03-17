export async function getNews(query?: string) {
    const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY3;

    // If a query exists, search 'everything', otherwise get 'top-headlines'
    const endpoint = query
        ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`
        : `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

    try {
        const res = await fetch(endpoint, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
            throw new Error(`Error fetching news: ${res.statusText}`);
        }

        return await res.json();
    } catch (error) {
        console.error(error);
        return { articles: [] }; // Return empty structure on error to prevent crash
    }
}
