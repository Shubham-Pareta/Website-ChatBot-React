import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import html2text

HEADERS = {"User-Agent": "Mozilla/5.0"}

def get_all_links(base_url, max_pages=3):
    if not base_url.startswith("http"):
        base_url = "https://" + base_url

    visited, to_visit = set(), [base_url]
    domain = urlparse(base_url).netloc

    while to_visit and len(visited) < max_pages:
        url = to_visit.pop()
        if url in visited:
            continue

        try:
            res = requests.get(url, headers=HEADERS, timeout=5)
            if res.status_code != 200:
                continue
        except:
            continue

        visited.add(url)
        soup = BeautifulSoup(res.text, "html.parser")

        for link in soup.find_all("a", href=True):
            full_url = urljoin(url, link["href"])
            if urlparse(full_url).netloc == domain:
                if full_url not in visited:
                    to_visit.append(full_url)

    return list(visited)

def extract_text_and_title(url):
    try:
        res = requests.get(url, headers=HEADERS, timeout=5)
        if res.status_code != 200: return "", ""
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        for tag in soup(["script", "style", "header", "footer", "nav", "aside"]):
            tag.decompose()

        content_area = soup.find("main") or soup.find("article") or soup.body
        
        h = html2text.HTML2Text()
        h.ignore_links = True
        h.ignore_images = True
        text = h.handle(str(content_area))

        title = soup.title.string.strip() if soup.title else "Untitled"
        return text[:5000], title 
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return "", ""