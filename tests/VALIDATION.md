# Verificação da versão 1.4.0

Executada em 1 de novembro de 2026, em instalação isolada: Foundry VTT 13.351, FateX 1.5.4 e Chrome. Nenhum mundo da campanha foi modificado.

- Testes de regras: migração repetível, carga dos dois kits, preservação de piloto/sistemas/avarias, limites de façanhas, compatibilidade de feixes, escala anti-MS, dano em empate e falha, armadura sem acumulação, usos e armazenamento.
- Navegador: kits, consumo de granada, rerrolagem sem novo consumo, comparação de dano, persistência, manual e largura de 390 px sem transbordamento horizontal.
- Foundry, mestre: rolagens 4dF no chat; consumo, escudo e recarga de munição persistidos após fechar e reabrir; ataques na cabine.
- Foundry, observador em outra sessão: sem controles de consumo ou edição; invocação não altera pontos de destino.
- Atualização de ficha anterior: arma, notas e alcance preservados; cópia exata dos dados anteriores guardada no primeiro salvamento e mantida depois.
- Modo Jogar: invocar +2 e rerrolar gastam pontos de destino; uma granada continua gastando somente um uso.
- Inspeção visual dos cartões no Foundry em tema escuro e da ficha web em tamanho de celular.

Os testes não substituem uma sessão de jogo para avaliar equilíbrio. Compras, reparos, condições das façanhas e permissões da ficção continuam dependendo da mesa, como descrito no manual.

Teste de regras reproduzível: `node --test tests/equipment.test.mjs`.
