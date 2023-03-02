import type { Report } from '../types.js';

export function mdFormatter(report: Report): string {
  const fileNames = [...new Set(report.items.map((item) => item.analysisTarget))];

  let text = ``;

  text += `### Summary:\n`;

  for (const block of report.summary) {
    text += `Project Name: ${block.projectName}\n`;
    text += `Typescript Version: ${block.tsVersion}\n`;
    text += `Base path: ${block.basePath}\n`;
    text += `timestamp: ${block.timestamp}\n`;
    text += `\n`;
  }

  text += `### Results:\n`;

  for (const fileName of fileNames) {
    const items = report.items.filter((item) => item.analysisTarget === fileName);

    text += `\n`;
    text += `#### File: ${fileName}, issues: ${items.length}:\n`;

    for (const item of items) {
      text += `\n`;
      text += `**${item.category} ${item.ruleId}**: 'NEED TO BE FIXED MANUALLY'\n`;
      text += `${item.hint}\n`;
      text += `Code: \`${item.nodeText}\`\n`;
    }
  }

  return text;
}
