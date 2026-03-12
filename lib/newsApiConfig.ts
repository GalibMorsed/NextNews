export function getPreferredNewsApiKeys(): string[] {
  const keys = [process.env.NEWS_AI_KEY2, process.env.NEWS_API_KEY3].filter(
    (key): key is string => Boolean(key && key.trim()),
  );

  return keys;
}

