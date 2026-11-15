import axios from 'axios'

// AnimeThemes 公開的 GraphQL API：依年份、季度列出動畫與 OP/ED，不需要金鑰
const GRAPHQL_URL = 'https://graphql.animethemes.moe/'

const SEASON_QUERY = `
query ($year: Int!, $season: AnimeSeason!, $page: Int) {
  animeyears(year: [$year]) {
    season(season: $season) {
      anime(first: 100, page: $page, sort: [TITLE_ROMAJI]) {
        paginatorInfo { hasMorePages }
        data {
          id
          format
          siteUrl
          title { romaji english native }
          images(first: 2) { edges { node { facet link } } }
          animethemes {
            id
            slug
            type
            group { name }
            song {
              title { romaji native }
              performances { as artist { name { main native } } }
            }
          }
        }
      }
    }
  }
}`

const query = async (body) => {
  const res = await axios.post(GRAPHQL_URL, body)
  if (res.data?.errors?.length) throw new Error(res.data.errors[0].message)
  return res.data.data
}

// 有資料的年份，由新到舊
export const fetchAnimeYears = async () => {
  const data = await query({ query: '{ animeyears { year } }' })
  return data.animeyears.map((item) => item.year).sort((a, b) => b - a)
}

// 某一季的所有動畫與主題曲；season: WINTER | SPRING | SUMMER | FALL
export const fetchSeasonAnime = async (year, season) => {
  const anime = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const data = await query({ query: SEASON_QUERY, variables: { year, season, page } })
    const result = data.animeyears[0]?.season[0]?.anime
    anime.push(...(result?.data ?? []))
    hasMore = result?.paginatorInfo?.hasMorePages ?? false
    page++
  }
  return anime
}
