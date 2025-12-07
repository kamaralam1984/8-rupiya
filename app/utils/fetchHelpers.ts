/**
 * Safely parses a JSON response from a fetch request.
 * Checks if the response is ok and has JSON content-type before parsing.
 * 
 * @param response - The fetch Response object
 * @returns Promise that resolves to the parsed JSON data, or null if parsing fails
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T | null> {
  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const text = await response.text();
    console.error(`Response not ok (${response.status}):`, text.substring(0, 200));
    return null;
  }

  // Check content-type to ensure it's JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Response is not JSON:', text.substring(0, 200));
    return null;
  }

  try {
    return await response.json() as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Wrapper for fetch that automatically handles JSON parsing with error checking
 * 
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @returns Promise that resolves to the parsed JSON data, or null if request fails
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    return await safeJsonParse<T>(response);
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return null;
  }
}

