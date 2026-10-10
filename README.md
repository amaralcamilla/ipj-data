# ipj-data

Dados públicos consumidos pelo app da Igreja Presbiteriana de Joinville.

## videos.json

Últimas 3 transmissões ao vivo encerradas do canal [@IgrejaPresbiterianadeJoinville](https://www.youtube.com/@IgrejaPresbiterianadeJoinville/streams), gerado automaticamente pelo workflow `.github/workflows/update-videos.yml` (domingos às 21h30).

- `titulo`: título da live
- `preletor`: texto após o último ` - ` da primeira linha da descrição (ex.: `Culto noturno de 04/10/2026 - Rev. Joel Lino Lemes`)
- `data`: data de início da live (AAAA-MM-DD, horário de Brasília)

Para atualizar manualmente: aba **Actions** → *Atualiza transmissões recentes* → **Run workflow**.

## avisos.json

Páginas do PDF mais recente da [pasta do mural de avisos](https://drive.google.com/drive/folders/18IXGH8P60BWBuZ7ReSI5YXd_miCF3BYr), convertidas em JPEG (sem a primeira e a última página) pelo workflow `.github/workflows/update-notices.yml` (domingos às 5h). Só é atualizado quando o PDF da pasta muda.

- `atualizadoEm`: data em que o PDF novo foi encontrado (AAAA-MM-DD)
- `proporcao`: largura / altura das páginas
- `paginas`: URLs das imagens, em ordem

## Configuração

Requer o secret `YOUTUBE_API_KEY`: chave de API do Google com acesso à YouTube Data API v3 e à Google Drive API.
