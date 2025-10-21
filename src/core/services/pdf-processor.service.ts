import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as sharp from 'sharp';

// Importação dinâmica para pdf2pic
const pdf2pic = require('pdf2pic');

@Injectable()
export class PdfProcessorService {
  private readonly logger = new Logger(PdfProcessorService.name);

  /**
   * Extrai a primeira página de um PDF e converte para imagem AVIF
   * @param pdfPath Caminho para o arquivo PDF
   * @param outputDir Diretório onde salvar a imagem gerada
   * @param filename Nome base para o arquivo de saída (sem extensão)
   * @returns Caminho relativo da imagem gerada
   */
  async extractFirstPageAsImage(
    pdfPath: string,
    outputDir: string,
    filename: string,
  ): Promise<string> {
    // Validações de segurança
    if (!pdfPath || !outputDir || !filename) {
      throw new Error('Parâmetros obrigatórios não fornecidos');
    }

    // Previne path traversal
    if (
      pdfPath.includes('..') ||
      outputDir.includes('..') ||
      filename.includes('..')
    ) {
      throw new Error('Caminhos contêm caracteres não permitidos');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
      throw new Error('Nome do arquivo contém caracteres não permitidos');
    }

    try {
      await fs.mkdir(outputDir, { recursive: true });

      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300, // DPI para qualidade alta
        saveFilename: 'temp_page',
        savePath: outputDir,
        format: 'png',
        width: 800,
        height: 1200,
      });

      this.logger.log(`Extraindo primeira página do PDF: ${pdfPath}`);

      let result;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          this.logger.log(
            `Tentativa ${attempts}/${maxAttempts} de extração do PDF`,
          );

          result = await Promise.race([
            convert(1, { responseType: 'image' }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Timeout na extração do PDF')),
                30000,
              ),
            ),
          ]);

          if (result && result.path) {
            break;
          }

          throw new Error('Resultado inválido da extração');
        } catch (error) {
          this.logger.warn(`Tentativa ${attempts} falhou: ${error.message}`);

          if (attempts === maxAttempts) {
            throw error;
          }

          // Aguarda antes da próxima tentativa
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!result || !result.path) {
        throw new Error(
          'Falha ao extrair página do PDF após todas as tentativas',
        );
      }

      const tempImagePath = result.path;
      const finalImagePath = join(outputDir, `${filename}.avif`);

      try {
        // Converte PNG para AVIF usando Sharp para melhor compressão
        await sharp(tempImagePath)
          .avif({
            quality: 80,
            effort: 6, // Máximo esforço de compressão
          })
          .toFile(finalImagePath);

        this.logger.log(`Capa gerada com sucesso: ${finalImagePath}`);

        // Retorna o caminho relativo para armazenar no banco
        return finalImagePath.replace(process.cwd(), '').replace(/\\/g, '/');
      } finally {
        // Sempre remove o arquivo temporário PNG, mesmo em caso de erro
        try {
          await fs.unlink(tempImagePath);
          this.logger.log(`Arquivo temporário removido: ${tempImagePath}`);
        } catch (unlinkError) {
          this.logger.warn(
            `Falha ao remover arquivo temporário: ${unlinkError.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar PDF: ${error.message}`, error.stack);

      // Tratamento específico para diferentes tipos de erro
      if (error.message.includes('EPIPE')) {
        throw new Error(
          'Erro de comunicação com o processador de PDF. Tente novamente.',
        );
      } else if (error.message.includes('Timeout')) {
        throw new Error(
          'Tempo limite excedido no processamento do PDF. Arquivo muito grande ou corrompido.',
        );
      } else if (error.message.includes('ENOENT')) {
        throw new Error('Arquivo PDF não encontrado ou inacessível.');
      } else {
        throw new Error(`Falha ao extrair capa do PDF: ${error.message}`);
      }
    }
  }

  /**
   * Remove arquivo do sistema de arquivos de forma segura
   * @param filePath Caminho do arquivo a ser removido
   */
  async removeFile(filePath: string): Promise<void> {
    try {
      // Validações de segurança
      if (!filePath || filePath.trim().length === 0) {
        this.logger.warn('Caminho do arquivo vazio ou inválido');
        return;
      }

      // Previne path traversal
      if (filePath.includes('..')) {
        this.logger.warn(`Tentativa de path traversal detectada: ${filePath}`);
        return;
      }

      const fullPath = filePath.startsWith('/')
        ? join(process.cwd(), filePath)
        : filePath;

      // Garante que o arquivo está dentro do diretório do projeto
      const projectRoot = process.cwd();
      const resolvedPath = join(projectRoot, filePath.replace(projectRoot, ''));

      if (!resolvedPath.startsWith(projectRoot)) {
        this.logger.warn(
          `Tentativa de acesso fora do diretório do projeto: ${filePath}`,
        );
        return;
      }

      await fs.access(resolvedPath);
      await fs.unlink(resolvedPath);
      this.logger.log(`Arquivo removido: ${resolvedPath}`);
    } catch (error) {
      // Log do erro mas não falha a operação se o arquivo não existir
      this.logger.warn(
        `Não foi possível remover arquivo ${filePath}: ${error.message}`,
      );
    }
  }

  /**
   * Valida se um arquivo é um PDF válido
   * @param filePath Caminho do arquivo
   * @returns true se for um PDF válido
   */
  async validatePdf(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      // Verifica se o arquivo começa com a assinatura PDF
      return buffer.toString('ascii', 0, 4) === '%PDF';
    } catch (error) {
      this.logger.error(`Erro ao validar PDF: ${error.message}`);
      return false;
    }
  }
}
