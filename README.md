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
- Avarias marcadas tocando no corpo da máquina, com um corpo para cada tipo: mobile suit, mobile armor e nave de guerra. Avaria moderada ou severa zera o sistema daquele local.
- Modo de combate com escala do oponente, invocação +2, rerrolagem e ejeção (conceder).
- Dois modos: **Editar**, para montar a ficha, e **Jogar**, para consultar, rolar, marcar estresse/consequências e usar equipamentos. Quem só observa o ator vê o modo Jogar sem controles de consumo ou edição.
- Inventário pessoal e da máquina: carga de seis espaços, armazenamento, estado dos itens, consumíveis, munição e proteção.
- Kits do **MS-06F Zaku II** e do **MS-14A Gelgoog**, com seis espaços de carga e compatibilidade de armas.
- Ataques pessoais e de MS, alcance em zonas, escala de ameaça independente do portador e comparador de tensões com defesa e armadura informadas.
- Manual completo da adaptação dentro da própria ficha.

## Imagens

As figuras padrão do piloto e do mobile suit são desenhos originais gerados por IA. Use o botão **Imagem** para trocar pelo retrato do seu personagem e pela sua máquina, e o botão **Prompt** para copiar uma descrição pronta para gerar a sua imagem em outra IA.

## Equipamentos (1.4.0)

No modo **Editar**, abra Equipamentos pessoais ou Equipamentos da máquina. Escolha um item do catálogo e clique **Adicionar**, ou use **Criar item**. Abra o item para alterar valores, limites e estado. Os botões **Kit Zaku II** e **Kit Gelgoog** pedem um segundo clique antes de substituir somente a carga da máquina. Eles não alteram sistemas, piloto, avarias ou façanhas existentes. Se houver vaga, reservam a façanha Escudo; caso contrário, é preciso liberar uma vaga para ter absorção.

No modo **Jogar**, informe escala e distância do alvo, então clique **Atacar** ou **Usar e rolar**. Consumíveis gastam um uso por rolagem inicial, inclusive em falha; invocar ou rerrolar não gasta outro. Arma e escala de dano não somam ao acerto. O comparador pede a defesa sem escala e a armadura aplicável; ele não altera outro ator.

**Marcar esgotada** registra um evento da história, custo aceito ou aspecto forçado. Uma reserva recarrega apenas uma arma esgotada da mesma família. **Reabastecer entre missões** exige estoque e infraestrutura: repõe usos e escudo, mas não remove avarias nem conserta itens inutilizados.

A proteção mostrada é o maior valor aplicável, sem somar peças. Cobertura, contato, regiões protegidas, condições das façanhas, aquisição, fabricação e recuperação são adjudicados pela mesa. Essas regras da casa estão identificadas e explicadas na seção **Equipamentos** do manual.

### Compatibilidade de dados

As armas existentes migram sem apagar nome, notas, perícia, alcance ou potência. Os campos novos recebem valores iniciais editáveis. No primeiro salvamento após migrar, a ficha anterior fica em `flags.fate-gundam.equipmentBackup`; no navegador, em uma chave local terminada em `.equipment-backup`. Exportar o ator continua sendo a forma recomendada de guardar uma cópia completa antes de atualizações.

### Ficha fora do Foundry

Baixe `ficha-web.zip` nos anexos da release, extraia tudo e abra `index.html`. A ficha salva os dados no navegador e inclui Exportar/Importar. A cópia web do repositório é `standalone.html`, acompanhada da pasta `assets`.

### Verificação e empacotamento

`node --test tests/equipment.test.mjs` verifica migração, kits, carga, compatibilidade, escala, dano e armadura. `python tools/build-release.py` atualiza o código compartilhado na ficha web e gera `module.zip` e `ficha-web.zip`. O código de equipamentos é compartilhado entre a página e o Foundry.
