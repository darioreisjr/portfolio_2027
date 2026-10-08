# Recursos de terceiros

Arquivos do site que não foram criados pelo autor, com origem e licença. Recurso novo de terceiros entra aqui antes de entrar no repositório.

## Música de fundo da home

| Campo           | Valor                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Faixa           | Petals On The Water (full version) Japanese Fusion LoFi                                         |
| Autor           | kaazoom                                                                                         |
| Origem          | <https://pixabay.com/music/beats-petals-on-the-water-full-version-japanese-fusion-lofi-392739/> |
| Licença         | [Pixabay Content License](https://pixabay.com/service/license-summary/)                         |
| Baixada em      | 2026-10-08, pelo autor do site                                                                  |
| Arquivo no site | `apps/web-next/public/_home/audio/petals-on-the-water.v1.mp3` (2,25 MB)                         |
| Original        | MP3 de 256 kbps, 3 min 07 s, 6,0 MB. Não está no repositório                                    |

O que a licença permite e o que não permite, segundo o resumo dela: uso gratuito, sem obrigação de crédito, com modificação; não é permitido vender nem distribuir o conteúdo de forma avulsa, sem trabalho criativo aplicado e na forma em que está no Pixabay.

Como a faixa é usada aqui: modificada e como parte da home, tocada pelo botão de música. O site não a oferece para download. As etiquetas do arquivo levam título, autor e licença. Esta nota registra o uso; não é parecer jurídico.

Modificações feitas na conversão:

- recodificada em MP3 de 96 kbps, estéreo, 44,1 kHz;
- volume normalizado em -20 LUFS, para servir de fundo (volume médio medido: -21,8 dB);
- fade de 0,5 s na entrada e de 2 s na saída, para a repetição não dar tranco;
- etiquetas originais removidas e regravadas.

Feita com o ffmpeg da imagem `lscr.io/linuxserver/ffmpeg@sha256:a7182d4fe498feea393622b43513cfaecb3fd073dcd3c7f38e9d74a10a4e8702`, em contêiner sem rede. A imagem não é dependência do projeto. Comando:

```
ffmpeg -i original.mp3 -map 0:a:0 -map_metadata -1 \
  -af "loudnorm=I=-20:TP=-2:LRA=11,afade=t=in:d=0.5,areverse,afade=t=in:d=2,areverse" \
  -ar 44100 -ac 2 -c:a libmp3lame -b:a 96k \
  -metadata title="Petals On The Water (full version) Japanese Fusion LoFi" \
  -metadata artist="kaazoom" -metadata comment="Pixabay Content License - pixabay.com" \
  petals-on-the-water.v1.mp3
```

Para trocar a faixa: gerar o arquivo com outro nome ou outra versão (`.v2`), atualizar `MUSIC_SRC` em `apps/web-next/lib/music.ts` e esta página. O nome muda porque o arquivo fica um ano em cache.

## Fonte do site

M PLUS Rounded 1c, licença OFL-1.1, pelo pacote `@fontsource/m-plus-rounded-1c` (ver `packages/tokens/AGENTS.md`). A licença acompanha o pacote.
