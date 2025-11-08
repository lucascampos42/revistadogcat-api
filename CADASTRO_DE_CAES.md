# Documentação Detalhada para Cadastro de Cães com Upload de Arquivos

Este documento descreve o fluxo completo e detalhado para a criação de um novo cadastro de cão, utilizando uma arquitetura de upload em duas etapas com **pre-signed URLs**.

## Por que Usar Pre-signed URLs?

A abordagem de pre-signed URLs foi escolhida para resolver dois desafios principais com uploads de arquivos grandes, como vídeos:

1.  **Experiência do Usuário (UX):** Permite que o frontend monitore o progresso do upload e exiba uma barra de progresso em tempo real, dando feedback claro ao usuário e evitando a sensação de que a aplicação "travou".
2.  **Performance e Escalabilidade:** O upload do arquivo pesado é feito diretamente do cliente para o serviço de armazenamento (S3), sem sobrecarregar o nosso servidor. Isso mantém a API leve e responsiva, mesmo durante o envio de múltiplos arquivos grandes.

## Fluxo Geral em Detalhes

O processo é dividido em três etapas lógicas:

1.  **Geração da URL de Upload:** Para cada arquivo, o frontend solicita ao backend uma URL segura e temporária para o upload.
2.  **Upload Direto para o S3:** O frontend utiliza a URL recebida para enviar o arquivo diretamente para o S3, monitorando o progresso.
3.  **Criação do Cadastro:** Após os uploads, o frontend submete os dados do formulário ao backend, incluindo as URLs finais dos arquivos já armazenados no S3.

---

## Etapa 1: Iniciar o Upload e Obter a Pre-signed URL

Esta etapa deve ser repetida para **cada arquivo** que o usuário deseja enviar (foto de perfil, vídeo, etc.).

-   **Endpoint:** `POST /cadastro-cao/iniciar-upload`
-   **Autenticação:** Obrigatória (Bearer Token JWT).
-   **Corpo da Requisição (JSON):**
    É crucial que o `fileType` corresponda exatamente ao `Content-Type` que será usado na Etapa 2.

    ```json
    {
      "fileName": "video_rex.mp4",
      "fileType": "video/mp4"
    }
    ```

-   **Tipos de Arquivo Permitidos e Limites:**
    -   **Imagens (fotoPerfil, fotoLateral, pedigree):** `image/jpeg`, `image/png`, `image/webp`. Limite de 5MB.
    -   **Vídeo:** `video/mp4`, `video/quicktime`. Limite de 50MB.

-   **Resposta de Sucesso (201 Created):**
    A URL retornada tem uma validade limitada (atualmente 1 hora).

    ```json
    {
      "uploadUrl": "https://seu-bucket.s3.amazonaws.com/1678886400000-video_rex.mp4?X-Amz-Algorithm=..."
    }
    ```

-   **Possíveis Erros:**
    -   `401 Unauthorized`: Token JWT inválido ou ausente.
    -   `400 Bad Request`: `fileName` ou `fileType` não fornecidos no corpo da requisição.

---

## Etapa 2: Fazer o Upload do Arquivo para a Pre-signed URL

O frontend é responsável por esta etapa.

-   **Método:** `PUT`
-   **URL:** Use a `uploadUrl` completa retornada na Etapa 1.
-   **Cabeçalhos Essenciais:**
    -   `Content-Type`: **Deve ser idêntico** ao `fileType` enviado na etapa anterior. Uma divergência causará um erro de assinatura (SignatureDoesNotMatch) do S3.
-   **Corpo da Requisição:** O conteúdo binário bruto do arquivo.

### Exibindo o Progresso do Upload

Bibliotecas como o `axios` oferecem suporte nativo para monitorar o progresso do upload. Exemplo:

```javascript
const onUploadProgress = (progressEvent) => {
  const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
  console.log(`Upload: ${percentCompleted}%`);
};

await axios.put(uploadUrl, file, {
  headers: { 'Content-Type': file.type },
  onUploadProgress,
});
```

### Obtendo a URL Final do Arquivo

Após o upload ser bem-sucedido, a URL final do arquivo que deve ser enviada ao nosso backend é a parte da `uploadUrl` **antes do caractere `?`**.

**Exemplo:**
-   **`uploadUrl` recebida:** `https://seu-bucket.s3.amazonaws.com/arquivo.mp4?parametros...`
-   **URL final a ser enviada:** `https://seu-bucket.s3.amazonaws.com/arquivo.mp4`

---

## Etapa 3: Criar o Cadastro do Cão

Com as URLs de todos os arquivos em mãos, o frontend pode submeter o formulário final.

-   **Endpoint:** `POST /cadastro-cao`
-   **Autenticação:** Obrigatória (Bearer Token JWT).
-   **Corpo da Requisição (JSON):**
    Todos os campos de URL (`fotoPerfil`, `fotoLateral`, `videoUrl`, etc.) devem conter a URL final obtida na Etapa 2.

### Detalhamento dos Campos do Corpo da Requisição

| Campo             | Tipo      | Obrigatório? | Descrição                                                                                                  |
| ----------------- | --------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `nome`            | `string`  | **Sim**      | Nome do cão.                                                                                               |
| `sexo`            | `Enum`    | **Sim**      | Sexo do cão. Valores permitidos: `MACHO`, `FEMEA`.                                                         |
| `dataNascimento`  | `string`  | **Sim**      | Data de nascimento do cão, no formato `YYYY-MM-DD`.                                                        |
| `fotoPerfil`      | `string`  | **Sim**      | URL completa da foto de perfil, obtida após o upload na Etapa 2.                                            |
| `fotoLateral`     | `string`  | **Sim**      | URL completa da foto lateral, obtida após o upload na Etapa 2.                                             |
| `racaId`          | `string`  | Condicional  | ID de uma raça já existente. Obrigatório se `racaSugerida` não for preenchido.                             |
| `racaSugerida`    | `string`  | Condicional  | Nome de uma nova raça a ser sugerida. Obrigatório se `racaId` não for preenchido.                          |
| `proprietarioId`  | `string`  | Opcional     | ID do usuário proprietário. Se não for fornecido, o cão será associado ao usuário que fez a requisição.   |
| `peso`            | `string`  | Opcional     | Peso do cão (ex: "25kg").                                                                                  |
| `altura`          | `string`  | Opcional     | Altura do cão (ex: "60cm").                                                                                |
| `temPedigree`     | `boolean` | Opcional     | `true` se o cão tiver pedigree. Padrão: `false`.                                                           |
| `registroPedigree`| `string`  | Condicional  | Número de registro do pedigree. Obrigatório se `temPedigree` for `true`.                                   |
| `pedigreeFrente`  | `string`  | Opcional     | URL da foto do pedigree (frente), obtida na Etapa 2.                                                       |
| `pedigreeVerso`   | `string`  | Opcional     | URL da foto do pedigree (verso), obtida na Etapa 2.                                                        |
| `temMicrochip`    | `boolean` | Opcional     | `true` se o cão tiver microchip. Padrão: `false`.                                                          |
| `numeroMicrochip` | `string`  | Condicional  | Número do microchip. Obrigatório se `temMicrochip` for `true`.                                             |
| `titulos`         | `string`  | Opcional     | Títulos e conquistas do cão.                                                                               |
| `caracteristicas` | `string`  | Opcional     | Características especiais do cão.                                                                          |
| `videoOption`     | `Enum`    | Opcional     | Opção de vídeo. Valores: `UPLOAD`, `URL`, `WHATSAPP`, `NONE`.                                              |
| `videoUrl`        | `string`  | Condicional  | URL do vídeo. Obrigatório se `videoOption` for `UPLOAD` ou `URL`.                                          |
| `whatsappContato` | `string`  | Condicional  | Número de WhatsApp. Obrigatório se `videoOption` for `WHATSAPP`.                                           |
| `observacoes`     | `string`  | Opcional     | Observações adicionais.                                                                                    |

-   **Exemplo de Corpo da Requisição:**

    ```json
    {
      "nome": "Bolinha",
      "racaId": "clz987654321",
      "sexo": "MACHO",
      "dataNascimento": "2022-01-10T00:00:00.000Z",
      "fotoPerfil": "https://seu-bucket.s3.amazonaws.com/1678886400000-foto_perfil.jpg",
      "fotoLateral": "https://seu-bucket.s3.amazonaws.com/1678886400001-foto_lateral.jpg",
      "videoUrl": "https://seu-bucket.s3.amazonaws.com/1678886400002-video.mp4",
      "videoOption": "UPLOAD"
    }
    ```

-   **Resposta de Sucesso (201 Created):**
    Retorna o objeto completo do cão cadastrado, incluindo o `cadastroId` e as URLs salvas.

-   **Possíveis Erros:**
    -   `400 Bad Request`: Erro de validação dos dados. O corpo da resposta conterá detalhes sobre os campos inválidos.
    -   `401 Unauthorized`: Token JWT inválido ou ausente.
    -   `404 Not Found`: Se um `racaId` ou `proprietarioId` informado não existir.
