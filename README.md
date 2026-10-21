# Fate Gundam

Ficha de piloto e mobile suit para jogar Gundam com **Fate Core** no Foundry VTT.

O piloto e a máquina têm cada um a sua ficha, ligadas por uma escotilha de cabine. Fechar a escotilha abre o modo de combate, com cada ação já somando a perícia do piloto, o sistema da máquina e a escala do oponente. Um clique rola 4dF no chat.

## Instalação

No Foundry, vá em **Add-on Modules → Install Module** e cole este endereço em **Manifest URL**:

```
https://github.com/SrKote/fate-gundam/releases/latest/download/module.json
```

Depois ative o módulo no mundo (**Manage Modules**).

## Como usar

1. Crie ou abra um ator.
2. No cabeçalho da ficha, clique na engrenagem (**Configurar ficha**) e escolha **Ficha Fate Gundam**.
3. Para ver como funciona, use o botão **Exemplo: Lalah Sune** no fim da ficha.

A ficha funciona com qualquer sistema de jogo: os dados ficam guardados num flag do próprio ator (`flags.fate-gundam.json`). Testada no Foundry 13 com o sistema FateX.

## O que tem

- Pirâmide de perícias com Pilotagem no lugar de Condução, Recarga e caixas de estresse calculadas sozinhas.
- Encaixes de façanha visíveis e a opção de trocar encaixes vazios por Recarga (regra opcional da mesa).
- **Criador de façanha**: monta a frase nos três moldes do livro (bônus de +2, nova ação, exceção à regra) e confere cada regra enquanto você escolhe.
- Aspecto Newtype marcado com **NT**, que libera as façanhas Newtype e as armas psicomu.
- Máquina com cinco sistemas (Mobilidade, Mira, Combate, Sensores, Estrutura), classes, façanhas de sistema e armas.
- Avarias marcadas tocando no corpo da máquina. Avaria moderada ou severa zera o sistema daquele local.
- Modo de combate com escala do oponente, invocação +2, rerrolagem e ejeção (conceder).
- Manual completo da adaptação dentro da própria ficha.

## Imagens

As figuras padrão do piloto e do mobile suit são desenhos originais gerados por IA. Use o botão **Imagem** para trocar pelo retrato do seu personagem e pela sua máquina, e o botão **Prompt** para copiar uma descrição pronta para gerar a sua imagem em outra IA.
