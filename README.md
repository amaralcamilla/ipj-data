# ipj-data

Dados públicos consumidos pelo app da Igreja Presbiteriana de Joinville.

## videos.json

Últimas 3 transmissões ao vivo encerradas do canal [@IgrejaPresbiterianadeJoinville](https://www.youtube.com/@IgrejaPresbiterianadeJoinville/streams), gerado automaticamente pelo workflow `.github/workflows/update-videos.yml` (domingo 12h30, domingo 22h e segunda 8h).

- `titulo`: título da live
- `preletor`: texto após o último ` - ` da primeira linha da descrição (ex.: `Culto noturno de 04/10/2026 - Rev. Joel Lino Lemes`)
- `data`: data de início da live (AAAA-MM-DD, horário de Brasília)

Para atualizar manualmente: aba **Actions** → *Atualiza transmissões recentes* → **Run workflow**.

Requer o secret `YOUTUBE_API_KEY` (chave da YouTube Data API v3).
