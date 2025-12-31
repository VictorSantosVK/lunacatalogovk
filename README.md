📋 Guia de Contribuição (Para Iniciantes)

Este guia explica como contribuir no projeto sem quebrar nada 😄
Siga os passos abaixo sempre que for fazer qualquer alteração.

⚠️ Regras Importantes

🚫 NUNCA envie código direto para a branch main
✔ Todas as mudanças precisam passar por Pull Request (PR) e aprovação.

Isso garante que o projeto continue organizado e funcionando.

🔹 Passo 1: Preparar o projeto

Clone o repositório

Entre na pasta do projeto

Vá para a branch main

Atualize o código

git clone "https://github.com/VictorSantosVK/lunacatalogovk"
cd lunacatalogovk
git checkout main
git pull

🔹 Passo 2: Criar sua própria branch

Você nunca trabalha direto na main.
Sempre crie uma branch nova para sua tarefa.

git checkout -b feature/nome-da-tarefa

📌 Como escolher o nome da branch

Use algo simples e fácil de entender:

feature/pagina-produto → nova funcionalidade

fix/erro-login → correção de erro

chore/ajuste-estilo → ajustes simples

🔹 Passo 3: Desenvolver com cuidado

Enquanto estiver programando:

✔ Faça mudanças pequenas
✔ Teste antes de salvar
✔ Não deixe código quebrado

Quando estiver pronto para salvar:

git status
git add .
git commit -m "O que foi feito de forma simples"


📌 Exemplo de commit bom:
"Criada página de produto"
"Corrigido erro no login"

🔹 Passo 4: Enviar sua branch para o GitHub

Envie somente a branch que você criou.

git push -u origin feature/nome-da-tarefa


⚠️ Nunca use:

git push origin main

🔹 Passo 5: Abrir um Pull Request (PR)

No GitHub:

Clique em New Pull Request

Base: main

Compare: sua branch

Explique o que você fez

Aguarde a aprovação

📌 Exemplo simples de descrição do PR
O que foi feito:
- Criada página de produto
- Ajustado layout

Observações:
- Não afeta outras telas

🔹 Passo 6: Ajustes após revisão

Se alguém pedir ajustes:

Corrija o código

Faça novo commit na mesma branch

Envie novamente

git add .
git commit -m "Ajustes solicitados na revisão"
git push


🔄 O PR será atualizado automaticamente.

❌ O que NÃO pode fazer

🚫 Trabalhar direto na main
🚫 Enviar código sem testar
🚫 Commits sem explicação
🚫 Misturar várias tarefas no mesmo PR

✅ Quando termina a tarefa

✔ PR aprovado
✔ Merge feito pelo responsável
✔ Branch apagada após o merge
