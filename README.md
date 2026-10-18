StockPilot — App-এর Purpose, Problems ও Complete To-Do List

১. App-এর মূল Purpose কী?
StockPilot হলো ছোট ব্যবসার inventory ও sales management system, যার মাধ্যমে ব্যবসার মালিক জানতে পারবেন কোন product কতটি stock-এ আছে, কী বিক্রি হচ্ছে, কখন stock শেষ হওয়ার ঝুঁকি আছে এবং কখন নতুন product order করা উচিত।
মূল লক্ষ্য শুধু product-এর list তৈরি করা নয়। বরং stock-এর হিসাব, sales এবং purchase-এর মধ্যে সম্পর্ক তৈরি করা, যাতে ভুল হিসাব ও অপ্রয়োজনীয় কাজ কমে।
StockPilot

Inventory & Sales Tracker with AI Restock Suggestions

Inventory visibility
প্রতিটি product-এর বর্তমান stock, price ও reorder level জানা।


Accurate sales
Sale তৈরি হলে stock স্বয়ংক্রিয়ভাবে কমবে এবং sales history থাকবে।


Purchase tracking
Supplier-এর কাছে order এবং stock-এ পণ্য আসার হিসাব রাখা।


Smarter restocking
আগের sales data থেকে সম্ভাব্য demand অনুমান করে restock suggestion দেওয়া।



২. কোন কোন Problem Solve করবে?
Business problem	StockPilot-এর solution
কত product বাকি আছে জানা কঠিন	Product-wise stock tracking
খাতা বা spreadsheet-এ ভুল হিসাব	Sales ও purchase-এর সঙ্গে stock update
Product শেষ হওয়ার পর বুঝতে পারা	Low-stock ও out-of-stock alert
কোন product বেশি বিক্রি হচ্ছে জানা কঠিন	Sales report ও top-selling products
Supplier-এর order-এর হিসাব হারিয়ে যাওয়া	Purchase order tracking
পুরোনো stock পরিবর্তনের কারণ খুঁজে না পাওয়া	Stock movement history
ব্যবসার দৈনিক performance বোঝা কঠিন	Dashboard ও reports
কখন নতুন stock কিনতে হবে বোঝা কঠিন	Sales history-ভিত্তিক AI restock suggestion
Staff-এর কাজ নিয়ন্ত্রণ করা কঠিন	Admin/Staff role-based permissions
উদাহরণ: বাস্তবে app কীভাবে কাজ করবে?
ধরো, একটি দোকানে Cooking Oil-এর stock ২০টি।
1. তুমি ৫টি Cooking Oil বিক্রি করলে stock হবে ১৫টি।
2. Stock reorder level ১০ হলে এখনো low-stock alert আসবে না।
3. পরবর্তী sale-এর পর stock ১০ বা তার নিচে নামলে alert দেখাবে।
4. Purchase Order তৈরি করে supplier-এর কাছে ৩০টি order করলে সেটি pending/ordered অবস্থায় থাকবে।
5. পণ্য বাস্তবে দোকানে পৌঁছানোর পর order-টি Received করলে stock বাড়বে।
6. Sales history যথেষ্ট থাকলে AI module আগামী দিনের সম্ভাব্য demand এবং suggested restock quantity দেখাবে।
এভাবে sale, purchase এবং stock-এর হিসাব পরস্পরের সঙ্গে সামঞ্জস্যপূর্ণ থাকবে।


Phase 1 — Planning & Setup
Project foundation
.Todo Project purpose ও scope final করা
.Todo Git repository তৈরি ও initial commit
.Todo Next.js + TypeScript frontend তৈরি
.Todo Tailwind CSS ও shadcn/ui setup
.Todo Express + TypeScript backend তৈরি
.Todo PostgreSQL database তৈরি ও connection যাচাই
.Todo Prisma install ও configuration
.Todo .env এবং .env.example setup

Phase 2 — Database
Models and relationships
.Todo Prisma enums তৈরি
.Todo User model তৈরি
.Todo Category ও Supplier models তৈরি
.Todo Product model তৈরি
.Todo Sale ও SaleItem models তৈরি
.Todo PurchaseOrder ও PurchaseOrderItem models তৈরি
.Todo StockMovement model তৈরি
.Todo Relations, indexes ও constraints যাচাই
.Todo Migration চালানো এবং seed data যোগ করা

Phase 3 — Authentication
Secure access
.Todo Password hashing implement
.Todo Login API তৈরি
.Todo JWT authentication implement
.Todo Current user/profile API তৈরি
.Todo Admin/Staff authorization
.Todo Login page তৈরি
.Todo Protected frontend routes ও logout

Phase 4 — Inventory
Products, categories, suppliers
.Todo Category CRUD API
.Todo Supplier CRUD API
.Todo Product CRUD API
.Todo Product search, filters ও pagination
.Todo Category frontend pages
.Todo Supplier frontend pages
.Todo Product list ও create/edit pages
.Todo Product details ও stock status
.Todo Stock movement API ও history page

Phase 5 — Sales & Purchases
Core business workflow
.Todo Sales history API
.Todo Sale creation validation
.Todo Sale transaction ও stock decrement
.Todo Sale history ও invoice pages
.Todo Purchase order CRUD
.Todo Purchase order status workflow
.Todo Receiving transaction ও stock increment
.Todo Duplicate request ও double-receive prevention
.Todo Core sales/purchase integration tests

Phase 6 — Dashboard & Reports
Business visibility
.Todo Dashboard summary API
.Todo Sales trend API
.Todo Low-stock products API
.Todo Top-selling products API
.Todo Dashboard UI ও KPI cards
.Todo Sales charts ও recent sales
.Todo Reports page
.Todo Inventory valuation ও CSV export

Phase 7 — AI Restock
Forecasting and evaluation
.Todo Historical daily sales data প্রস্তুত
.Todo Baseline forecasting method implement
.Todo Next 7 days demand prediction
.Todo Suggested restock quantity হিসাব
.Todo AI restock API
.Todo Restock recommendations UI
.Todo Holdout data-তে prediction পরীক্ষা
.Todo MAE calculation ও evaluation UI
.Todo Insufficient history warning

Phase 8 — Final Delivery
Quality and submission
.Todo User profile ও settings complete
.Todo Frontend responsive testing
.Todo API validation ও error handling review
.Todo Authentication ও permission tests
.Todo README ও .env.example final করা
.Todo Git commit history review
.Todo Deployment ও live demo verify
.Todo নিজের implementation ব্যাখ্যা করার প্রস্তুতি