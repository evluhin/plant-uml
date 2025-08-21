import { spawn } from 'child_process';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'plantuml-renderer' });

export interface PlantUMLOptions {
  format: 'svg' | 'png';
  theme?: string | undefined;
}

export async function renderPlantUML(source: string, options: PlantUMLOptions): Promise<Buffer> {
  const startTime = Date.now();
  
  // Prepend theme if specified
  let processedSource = source;
  if (options.theme && options.theme !== 'default') {
    processedSource = `!theme ${options.theme}\n${source}`;
  }
  
  const jarPath = process.env.PLANTUML_JAR || '/opt/plantuml.jar';
  const dotPath = process.env.GRAPHVIZ_DOT || '/opt/bin/dot';
  
  const formatFlag = options.format === 'svg' ? '-tsvg' : '-tpng';
  
  const args = [
    '-Djava.awt.headless=true',
    '-Dfile.encoding=UTF-8',
    '-jar', jarPath,
    formatFlag,
    '-pipe',
    '-charset', 'UTF-8'
  ];
  
  return new Promise((resolve, reject) => {
    const child = spawn('java', args, {
      env: {
        ...process.env,
        GRAPHVIZ_DOT: dotPath,
        PATH: `/opt/bin:${process.env.PATH || ''}`,
        LD_LIBRARY_PATH: `/opt/lib:${process.env.LD_LIBRARY_PATH || ''}`
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];
    
    child.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    child.stderr.on('data', (chunk: Buffer) => {
      errorChunks.push(chunk);
    });
    
    child.on('close', (code) => {
      const renderTime = Date.now() - startTime;
      
      if (code === 0) {
        const result = Buffer.concat(chunks);
        logger.info('PlantUML render successful', { 
          renderTimeMs: renderTime,
          outputSize: result.length,
          format: options.format
        });
        resolve(result);
      } else {
        const errorOutput = Buffer.concat(errorChunks).toString();
        logger.error('PlantUML render failed', { 
          exitCode: code,
          error: errorOutput,
          renderTimeMs: renderTime
        });
        reject(new Error(`PlantUML failed with code ${code}: ${errorOutput}`));
      }
    });
    
    child.on('error', (error) => {
      logger.error('PlantUML process error', { error: error.message });
      reject(error);
    });
    
    // Send source to stdin
    child.stdin.write(processedSource);
    child.stdin.end();
    
    // Timeout after 15 seconds
    setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('PlantUML render timeout'));
    }, 15000);
  });
}