import { prisma } from "../src/config/prisma.js";
import jwt from "jsonwebtoken";

const API_URL = "http://localhost:4001/api/v1";
const JWT_SECRET = process.env.JWT_SECRET || "echocheck_super_secret_jwt_key_2026";

interface AuditResult {
  module: string;
  endpoint: string;
  status: "PASS" | "FAIL" | "BLOCKED";
  message: string;
}

const auditResults: AuditResult[] = [];

function record(module: string, endpoint: string, status: "PASS" | "FAIL" | "BLOCKED", message: string) {
  auditResults.push({ module, endpoint, status, message });
  console.log(`[${status}] [${module}] ${endpoint} -> ${message}`);
}

async function runAudit() {
  console.log("=== StockPilot Complete Backend Audit ===\n");

  try {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      throw new Error("No admin user in database");
    }

    const adminToken = jwt.sign(
      { id: admin.id, role: admin.role, email: admin.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    let staff = await prisma.user.findFirst({ where: { role: "STAFF" } });
    if (!staff) {
      staff = await prisma.user.create({
        data: {
          name: "Test Staff Member",
          email: `audit.staff.${Date.now()}@example.com`,
          passwordHash: "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0vJq6Q7qQY1Q9e8Qz6z0.v0",
          role: "STAFF",
          isActive: true,
        },
      });
    }

    const staffToken = jwt.sign(
      { id: staff.id, role: staff.role, email: staff.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const authMeRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record("Auth", "GET /auth/me", authMeRes.status === 200 ? "PASS" : "FAIL", `Status: ${authMeRes.status}`);

    const staffMeRes = await fetch(`${API_URL}/staff/me`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Staff", "GET /staff/me", staffMeRes.status === 200 ? "PASS" : "FAIL", `Status: ${staffMeRes.status}`);

    const staffSummaryRes = await fetch(`${API_URL}/staff/me/sales/summary`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Staff", "GET /staff/me/sales/summary", staffSummaryRes.status === 200 ? "PASS" : "FAIL", `Status: ${staffSummaryRes.status}`);

    const staffActivitiesRes = await fetch(`${API_URL}/staff/me/activities`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Staff", "GET /staff/me/activities", staffActivitiesRes.status === 200 ? "PASS" : "FAIL", `Status: ${staffActivitiesRes.status}`);

    const usersRes = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record("Users", "GET /users (Admin)", usersRes.status === 200 ? "PASS" : "FAIL", `Status: ${usersRes.status}`);

    const usersForbiddenRes = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Users", "GET /users (Staff Forbidden)", usersForbiddenRes.status === 403 ? "PASS" : "FAIL", `Status: ${usersForbiddenRes.status}`);

    const catName = `AuditCat_${Date.now()}`;
    const createCatRes = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: catName, description: "Audit category" }),
    });
    const catData = await createCatRes.json();
    const createdCatId = catData.data?.id;
    record("Categories", "POST /categories", createCatRes.status === 201 ? "PASS" : "FAIL", `Status: ${createCatRes.status}`);

    const getCatsRes = await fetch(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Categories", "GET /categories", getCatsRes.status === 200 ? "PASS" : "FAIL", `Status: ${getCatsRes.status}`);

    const supName = `AuditSupplier_${Date.now()}`;
    const createSupRes = await fetch(`${API_URL}/suppliers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: supName,
        email: "supplier@example.com",
        phone: "01711112222",
        address: "Dhaka, Bangladesh",
      }),
    });
    const supData = await createSupRes.json();
    const createdSupId = supData.data?.id;
    record("Suppliers", "POST /suppliers", createSupRes.status === 201 ? "PASS" : "FAIL", `Status: ${createSupRes.status}`);

    const getSupsRes = await fetch(`${API_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Suppliers", "GET /suppliers", getSupsRes.status === 200 ? "PASS" : "FAIL", `Status: ${getSupsRes.status}`);

    let createdProdId = "";
    if (createdCatId && createdSupId) {
      const sku = `SKU_${Date.now()}`;
      const createProdRes = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          name: "Audit Test Product",
          categoryId: createdCatId,
          supplierId: createdSupId,
          unitPrice: 150,
          costPrice: 100,
          stockQty: 50,
          reorderLevel: 10,
        }),
      });
      const prodData = await createProdRes.json();
      createdProdId = prodData.data?.id;
      record("Products", "POST /products", createProdRes.status === 201 ? "PASS" : "FAIL", `Status: ${createProdRes.status}`);
    } else {
      record("Products", "POST /products", "BLOCKED", "Prerequisite category/supplier creation failed");
    }

    const getProdsRes = await fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Products", "GET /products", getProdsRes.status === 200 ? "PASS" : "FAIL", `Status: ${getProdsRes.status}`);

    const getLowStockRes = await fetch(`${API_URL}/products/low-stock`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    record("Products", "GET /products/low-stock", getLowStockRes.status === 200 ? "PASS" : "FAIL", `Status: ${getLowStockRes.status}`);

    let createdSaleId = "";
    let invoiceNo = "";
    if (createdProdId) {
      const createSaleRes = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: "Walk-in Customer",
          paymentMethod: "CASH",
          discount: 0,
          items: [
            {
              productId: createdProdId,
              quantity: 2,
              unitPrice: 150,
            },
          ],
        }),
      });
      const saleData = await createSaleRes.json();
      createdSaleId = saleData.data?.id;
      invoiceNo = saleData.data?.invoiceNo;
      record("Sales", "POST /sales (Stock decrement)", createSaleRes.status === 201 ? "PASS" : "FAIL", `Status: ${createSaleRes.status}`);

      const prodAfterSale = await prisma.product.findUnique({ where: { id: createdProdId } });
      const stockUpdated = prodAfterSale?.stockQty === 48;
      record("Business Logic", "Stock deduction on sale (50 -> 48)", stockUpdated ? "PASS" : "FAIL", `Stock: ${prodAfterSale?.stockQty}`);

      const excessiveSaleRes = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: "Oversell Customer",
          paymentMethod: "CASH",
          items: [
            {
              productId: createdProdId,
              quantity: 99999,
              unitPrice: 150,
            },
          ],
        }),
      });
      record("Business Logic", "Reject sale exceeding available stock", excessiveSaleRes.status === 400 ? "PASS" : "FAIL", `Status: ${excessiveSaleRes.status}`);
    } else {
      record("Sales", "POST /sales", "BLOCKED", "Prerequisite product creation failed");
    }

    if (invoiceNo) {
      const getInvoiceRes = await fetch(`${API_URL}/sales/invoice/${invoiceNo}`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      record("Sales", "GET /sales/invoice/:invoiceNo", getInvoiceRes.status === 200 ? "PASS" : "FAIL", `Status: ${getInvoiceRes.status}`);
    }

    if (createdProdId && createdSupId) {
      const createPoRes = await fetch(`${API_URL}/purchase-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId: createdSupId,
          note: "Audit purchase order",
          items: [
            {
              productId: createdProdId,
              quantity: 20,
              unitCost: 95,
            },
          ],
        }),
      });
      const poData = await createPoRes.json();
      const poId = poData.data?.id;
      record("Purchase Orders", "POST /purchase-orders", createPoRes.status === 201 ? "PASS" : "FAIL", `Status: ${createPoRes.status}`);

      if (poId) {
        await fetch(`${API_URL}/purchase-orders/${poId}/status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "ORDERED" }),
        });

        const receivePoRes = await fetch(`${API_URL}/purchase-orders/${poId}/receive`, {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        record("Purchase Orders", "POST /purchase-orders/:id/receive", receivePoRes.status === 200 ? "PASS" : "FAIL", `Status: ${receivePoRes.status}`);

        const prodAfterReceive = await prisma.product.findUnique({ where: { id: createdProdId } });
        const poStockUpdated = prodAfterReceive?.stockQty === 68;
        record("Business Logic", "Stock intake on PO receive (48 -> 68)", poStockUpdated ? "PASS" : "FAIL", `Stock: ${prodAfterReceive?.stockQty}`);
      }
    }

    const aiRecsRes = await fetch(`${API_URL}/ai-restock/recommendations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const aiRecsData = await aiRecsRes.json();
    const aiPass = aiRecsRes.status === 200 && aiRecsData.success === true;
    record("AI Restock", "GET /ai-restock/recommendations", aiPass ? "PASS" : "FAIL", `Status: ${aiRecsRes.status}, AI Status: ${aiRecsData.data?.summary?.aiStatus}`);

    const getMovementsRes = await fetch(`${API_URL}/stock-movements`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const movementsData = await getMovementsRes.json();
    record("Stock Movements", "GET /stock-movements", getMovementsRes.status === 200 && Array.isArray(movementsData.data) ? "PASS" : "FAIL", `Status: ${getMovementsRes.status}, Count: ${movementsData.data?.length}`);

    let createdMovementId = "";
    if (createdProdId) {
      const adjustRes = await fetch(`${API_URL}/stock-movements/adjustments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: createdProdId,
          quantityChange: -3,
          note: "Audit shrinkage adjustment",
        }),
      });
      const adjustData = await adjustRes.json();
      createdMovementId = adjustData.data?.id;
      record("Stock Movements", "POST /stock-movements/adjustments", adjustRes.status === 201 ? "PASS" : "FAIL", `Status: ${adjustRes.status}`);

      const prodAfterAdjust = await prisma.product.findUnique({ where: { id: createdProdId } });
      const adjustSuccess = prodAfterAdjust?.stockQty === 65;
      record("Business Logic", "Stock adjustment deduction (68 -> 65)", adjustSuccess ? "PASS" : "FAIL", `Stock: ${prodAfterAdjust?.stockQty}`);
    }

    if (createdMovementId) {
      const getSingleMovement = await fetch(`${API_URL}/stock-movements/${createdMovementId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      record("Stock Movements", "GET /stock-movements/:id", getSingleMovement.status === 200 ? "PASS" : "FAIL", `Status: ${getSingleMovement.status}`);
    }

    const dashSummaryRes = await fetch(`${API_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashSummaryData = await dashSummaryRes.json();
    const dashSummaryPass = dashSummaryRes.status === 200 && dashSummaryData.data?.inventory?.totalProducts > 0;
    record("Dashboard", "GET /dashboard/summary", dashSummaryPass ? "PASS" : "FAIL", `Status: ${dashSummaryRes.status}, Gross Rev: ${dashSummaryData.data?.sales?.grossRevenue}`);

    const dashTrendRes = await fetch(`${API_URL}/dashboard/sales-trend`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashTrendData = await dashTrendRes.json();
    record("Dashboard", "GET /dashboard/sales-trend", dashTrendRes.status === 200 && Array.isArray(dashTrendData.data) ? "PASS" : "FAIL", `Status: ${dashTrendRes.status}, Points: ${dashTrendData.data?.length}`);

    const dashTopRes = await fetch(`${API_URL}/dashboard/top-products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashTopData = await dashTopRes.json();
    record("Dashboard", "GET /dashboard/top-products", dashTopRes.status === 200 && Array.isArray(dashTopData.data) ? "PASS" : "FAIL", `Status: ${dashTopRes.status}, Items: ${dashTopData.data?.length}`);

    const repValuationRes = await fetch(`${API_URL}/reports/inventory-valuation`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const repValuationData = await repValuationRes.json();
    const repValuationPass = repValuationRes.status === 200 && repValuationData.data?.totalUnitsOnHand > 0;
    record("Reports", "GET /reports/inventory-valuation", repValuationPass ? "PASS" : "FAIL", `Status: ${repValuationRes.status}, Units on hand: ${repValuationData.data?.totalUnitsOnHand}`);

    const repSalesRes = await fetch(`${API_URL}/reports/sales`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const repSalesData = await repSalesRes.json();
    record("Reports", "GET /reports/sales", repSalesRes.status === 200 && repSalesData.data?.totalOrders >= 1 ? "PASS" : "FAIL", `Status: ${repSalesRes.status}, Orders: ${repSalesData.data?.totalOrders}`);

    const repPurchasesRes = await fetch(`${API_URL}/reports/purchases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const repPurchasesData = await repPurchasesRes.json();
    record("Reports", "GET /reports/purchases", repPurchasesRes.status === 200 && repPurchasesData.data?.totalOrders >= 1 ? "PASS" : "FAIL", `Status: ${repPurchasesRes.status}, POs: ${repPurchasesData.data?.totalOrders}`);

    const failed = auditResults.filter((r) => r.status === "FAIL");
    const passed = auditResults.filter((r) => r.status === "PASS");
    console.log(`\n=== Audit Summary: ${passed.length} PASSED, ${failed.length} FAILED, ${auditResults.filter(r => r.status === "BLOCKED").length} BLOCKED ===`);

    if (failed.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Audit threw exception:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
