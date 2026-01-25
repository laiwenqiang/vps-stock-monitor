/**
 * 使用本地 HTML 文件测试 Dmit Provider
 *
 * 步骤：
 * 1. 在浏览器中打开 Dmit 产品页面
 * 2. 右键 -> 查看页面源代码
 * 3. 复制 HTML 内容保存为 dmit-sample.html
 * 4. 运行此脚本: npx tsx test-dmit-local.ts dmit-sample.html
 */

import { DmitProvider } from "./src/providers/dmit.js";
import { readFileSync } from "fs";

async function testWithLocalHTML(htmlFile: string) {
  console.log("=".repeat(60));
  console.log("Dmit Provider 本地 HTML 测试");
  console.log("=".repeat(60));
  console.log();

  const provider = new DmitProvider();
  const html = readFileSync(htmlFile, "utf-8");

  console.log(`📄 HTML 文件: ${htmlFile}`);
  console.log(`📏 文件大小: ${html.length} 字符`);
  console.log();

  // 测试不同的解析方式
  const methods = [
    { name: "HTML 解析", fn: "parseHtmlResponse" },
    { name: "嵌入式 JSON", fn: "parseEmbeddedJson" },
  ];

  for (const method of methods) {
    console.log(`${"─".repeat(60)}`);
    console.log(`🔍 ${method.name}`);
    console.log("─".repeat(60));

    try {
      const status = (provider as any)[method.fn](html);

      console.log("✅ 解析成功");
      console.log();
      console.log("📊 库存状态:");
      console.log(`  有货: ${status.inStock ? "✅ 是" : "❌ 否"}`);
      if (status.qty !== undefined) {
        console.log(`  数量: ${status.qty}`);
      }
      if (status.price !== undefined) {
        console.log(`  价格: $${status.price}`);
      }
      console.log(`  时间: ${status.timestamp}`);

      if (status.rawSource) {
        console.log();
        console.log("📄 原始数据片段:");
        console.log(status.rawSource);
      }

      console.log();
      break; // 成功后不再尝试其他方法
    } catch (error) {
      console.log("❌ 解析失败");
      console.log(`  错误: ${(error as Error).message}`);
      console.log();
    }
  }

  console.log("=".repeat(60));
}

const htmlFile = process.argv[2];

if (!htmlFile) {
  console.error("❌ 错误: 请提供 HTML 文件路径");
  console.log();
  console.log("使用方法:");
  console.log("  1. 在浏览器中打开 Dmit 产品页面");
  console.log("  2. 右键 -> 查看页面源代码");
  console.log("  3. 复制 HTML 保存为文件（如 dmit-sample.html）");
  console.log("  4. 运行: npx tsx test-dmit-local.ts dmit-sample.html");
  process.exit(1);
}

testWithLocalHTML(htmlFile).catch((error) => {
  console.error("❌ 测试失败:");
  console.error(error);
  process.exit(1);
});
