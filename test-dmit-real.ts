/**
 * Dmit Provider 真实库存测试脚本
 *
 * 使用方法:
 * npx tsx test-dmit-real.ts <dmit-product-url>
 *
 * 示例:
 * npx tsx test-dmit-real.ts "https://www.dmit.io/cart.php?a=add&pid=123"
 */

import { DmitProvider } from "./src/providers/dmit.js";
import type { MonitorTarget } from "./src/models/types.js";

async function testRealDmitStock(url: string) {
  console.log("=".repeat(60));
  console.log("Dmit Provider 真实库存测试");
  console.log("=".repeat(60));
  console.log();

  const provider = new DmitProvider();

  // 检查 URL 是否支持
  const target: MonitorTarget = {
    id: "test-1",
    provider: "dmit",
    url: url,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("📋 测试配置:");
  console.log(`  URL: ${url}`);
  console.log(`  Provider: ${provider.name} (${provider.id})`);
  console.log();

  // 检查是否支持
  const isSupported = provider.supports(target);
  console.log(`✓ URL 支持检查: ${isSupported ? "✅ 支持" : "❌ 不支持"}`);

  if (!isSupported) {
    console.error("❌ 该 URL 不是有效的 Dmit URL");
    process.exit(1);
  }
  console.log();

  // 测试不同的 sourceType
  const sourceTypes: Array<"auto" | "api" | "json" | "html"> = [
    "auto",
    "html",
    "json",
    "api",
  ];

  for (const sourceType of sourceTypes) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`🔍 测试模式: ${sourceType.toUpperCase()}`);
    console.log("─".repeat(60));

    const testTarget = { ...target, sourceType };

    try {
      const startTime = Date.now();
      const status = await provider.fetchStatus(testTarget);
      const duration = Date.now() - startTime;

      console.log(`✅ 成功 (耗时: ${duration}ms)`);
      console.log();
      console.log("📊 库存状态:");
      console.log(`  有货: ${status.inStock ? "✅ 是" : "❌ 否"}`);
      if (status.qty !== undefined) {
        console.log(`  数量: ${status.qty}`);
      }
      if (status.price !== undefined) {
        console.log(`  价格: $${status.price}`);
      }
      if (status.region) {
        console.log(`  地区: ${status.region}`);
      }
      console.log(`  时间: ${status.timestamp}`);

      if (status.rawSource) {
        console.log();
        console.log("📄 原始数据片段 (前 200 字符):");
        console.log(status.rawSource.substring(0, 200));
      }

      // auto 模式成功后，不再测试其他模式
      if (sourceType === "auto") {
        console.log();
        console.log("✅ Auto 模式成功，跳过其他模式测试");
        break;
      }
    } catch (error) {
      console.log(`❌ 失败`);
      console.log();
      console.log("错误信息:");
      console.log(`  ${(error as Error).message}`);

      // 如果是 403 错误，提供更多信息
      if ((error as Error).message.includes("403")) {
        console.log();
        console.log("💡 提示:");
        console.log("  - Dmit 网站可能有反爬虫保护");
        console.log("  - 尝试在浏览器中打开该 URL，查看页面结构");
        console.log("  - 可能需要添加更多 HTTP 头或使用代理");
      }
    }
  }

  console.log();
  console.log("=".repeat(60));
  console.log("测试完成");
  console.log("=".repeat(60));
}

// 主函数
const url = process.argv[2];

if (!url) {
  console.error("❌ 错误: 请提供 Dmit 产品 URL");
  console.log();
  console.log("使用方法:");
  console.log('  npx tsx test-dmit-real.ts "https://www.dmit.io/cart.php?a=add&pid=123"');
  console.log();
  console.log("示例 URL:");
  console.log("  https://www.dmit.io/cart.php?a=add&pid=123");
  console.log("  https://www.dmit.io/cart.php?gid=1");
  process.exit(1);
}

testRealDmitStock(url).catch((error) => {
  console.error("❌ 测试脚本执行失败:");
  console.error(error);
  process.exit(1);
});
