✅ Checklist de Contribuição (Obrigatório)

⚠️ NÃO é permitido enviar código diretamente para a branch main.
Toda alteração deve passar por Pull Request e aprovação.

🔹 Antes de começar

 Clone o repositório

 Entre na pasta do projeto

 Confira se está na branch main

 Atualize o código local (git pull)

git clone https://github.com/VictorSantosVK/lunacatalogovk
cd lunacatalogovk
git checkout main
git pull

🔹 Criar uma branch para a tarefa

 Criar branch a partir da main

 Usar nome descritivo (feature, fix, chore)

git checkout -b feature/nome-da-tarefa


📌 Exemplos de nomes:

feature/pagina-produto

fix/erro-login

chore/ajuste-estilo

🔹 Durante o desenvolvimento

 Fazer commits pequenos e claros

 Não commitar código quebrado

 Testar antes de commitar

git status
git add .
git commit -m "Descrição clara do que foi feito"

🔹 Enviar código para o GitHub

 Enviar apenas a branch criada

 Nunca dar push direto na main

git push -u origin feature/nome-da-tarefa

🔹 Abrir Pull Request (PR)

 Abrir PR no GitHub

 Base: main

 Compare: sua branch

 Descrever o que foi feito

 Aguardar aprovação

📌 Exemplo de descrição do PR:

O que foi feito:
- Criada página de produto
- Ajustado layout

Observações:
- Sem impactos em outras telas

🔹 Após feedback

 Corrigir comentários solicitados

 Commitar ajustes na mesma branch

 Push novamente (o PR atualiza sozinho)

git add .
git commit -m "Ajustes solicitados na revisão"
git push

❌ Proibido

❌ Dar git push origin main

❌ Trabalhar direto na main

❌ Commits sem descrição

❌ Misturar várias tarefas no mesmo PR

✅ Finalização

 PR aprovado

 Merge feito pelo responsável do projeto

 Branch removida após o merge
