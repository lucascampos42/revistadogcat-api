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

    // Valida nome do arquivo
    if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
      throw new Error('Nome do arquivo contém caracteres não permitidos');
    }

    try {
      // Garante que o diretório de saída existe
      await fs.mkdir(outputDir, { recursive: true });

      // Configura pdf2pic para extrair apenas a primeira página
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300, // DPI para qualidade alta
        saveFilename: 'temp_page',
        savePath: outputDir,
        format: 'png',
        width: 800, // Largura máxima
        height: 1200, // Altura máxima
      });

      this.logger.log(`Extraindo primeira página do PDF: ${pdfPath}`);

      // Extrai apenas a primeira página (página 1)
      const result = await convert(1, { responseType: 'image' });
      
      if (!result || !result.path) {
        throw new Error('Falha ao extrair página do PDF');
      }

      const tempImagePath = result.path;
      const finalImagePath = join(outputDir, `${filename}.avif`);

      // Converte PNG para AVIF usando Sharp para melhor compressão
      await sharp(tempImagePath)
        .avif({
          quality: 80,
          effort: 6, // Máximo esforço de compressão
        })
        .toFile(finalImagePath);

      // Remove o arquivo temporário PNG
      await fs.unlink(tempImagePath);

      this.logger.log(`Capa gerada com sucesso: ${finalImagePath}`);

      // Retorna o caminho relativo para armazenar no banco
      return finalImagePath.replace(process.cwd(), '').replace(/\\/g, '/');
    } catch (error) {
      this.logger.error(`Erro ao processar PDF: ${error.message}`, error.stack);
      throw new Error(`Falha ao extrair capa do PDF: ${error.message}`);
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
        this.logger.warn(`Tentativa de acesso fora do diretório do projeto: ${filePath}`);
        return;
      }
      
      await fs.access(resolvedPath);
      await fs.unlink(resolvedPath);
      this.logger.log(`Arquivo removido: ${resolvedPath}`);
    } catch (error) {
      // Log do erro mas não falha a operação se o arquivo não existir
      this.logger.warn(`Não foi possível remover arquivo ${filePath}: ${error.message}`);
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