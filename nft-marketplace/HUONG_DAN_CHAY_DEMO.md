# Hướng dẫn chạy demo NFT Marketplace từ đầu

Để thấy **sản phẩm** trên trang chủ, bạn cần chạy **3 bước** theo đúng thứ tự. Thiếu một bước hoặc sai thứ tự sẽ dẫn đến không có dữ liệu (ô xám trống).

---

## Bước 1: Bật blockchain local (Hardhat node)

Mở **Terminal 1** trong thư mục dự án và chạy:

```bash
cd nft-marketplace
npx hardhat node
```

**Giữ terminal này mở** — không tắt. Khi chạy thành công bạn sẽ thấy dòng:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

---

## Bước 2: Deploy contract + tạo dữ liệu mẫu

Mở **Terminal 2** (terminal mới, không đóng Terminal 1):

```bash
cd nft-marketplace
npm run deploy:local
```

Đợi deploy xong, sẽ in ra 3 địa chỉ contract. **Sao chép 3 dòng** có dạng:

```
NEXT_PUBLIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_AUCTION_ADDRESS=0x...
```

Mở file **`.env.local`**, tìm 3 dòng tương ứng và **thay bằng 3 dòng vừa copy**.

Sau đó chạy tiếp để tạo NFT mẫu và đăng bán:

```bash
npm run seed:local
```

Đợi chạy xong (sẽ thấy "SEEDING COMPLETE", 6 NFT, 3 đang bán, 1 đấu giá).

---

## Bước 3: Chạy website và kết nối ví

Vẫn trong **Terminal 2** (hoặc mở Terminal 3):

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

- Bấm **Kết nối ví** → chọn **MetaMask**.
- Nếu MetaMask chưa có mạng Localhost:
  - Vào MetaMask → Mạng → Thêm mạng thủ công:
    - Tên: `Localhost 8545`
    - RPC URL: `http://127.0.0.1:8545`
    - Chain ID: `31337`
  - Chuyển ví sang mạng **Localhost 8545**.
- Tài khoản dùng có thể là bất kỳ; nếu cần ETH giả để test, trong Terminal 1 (hardhat node) có in ra danh sách account và private key — import Account #0 hoặc #1 vào MetaMask để có 10,000 ETH.

Sau khi kết nối đúng mạng, **refresh trang** (F5) — bạn sẽ thấy **Sản phẩm** (3 NFT đang bán) và tab **Đấu giá** (1 phiên đấu giá).

---

## Tóm tắt nhanh

| Thứ tự | Terminal | Lệnh | Ghi chú |
|--------|----------|------|--------|
| 1 | Terminal 1 (giữ mở) | `npx hardhat node` | Bật blockchain local |
| 2 | Terminal 2 | `npm run deploy:local` | Deploy contract, copy địa chỉ vào `.env.local` |
| 2 | Terminal 2 | `npm run seed:local` | Tạo 6 NFT + 3 đang bán + 1 đấu giá |
| 3 | Terminal 2 hoặc 3 | `npm run dev` | Chạy web, mở http://localhost:3000 |
| - | Trình duyệt | Kết nối ví → Mạng Localhost 8545 | Refresh trang để thấy sản phẩm |

---

## Lỗi thường gặp

- **Không thấy sản phẩm, toàn ô xám:**  
  - Kiểm tra Terminal 1 vẫn đang chạy `npx hardhat node`.  
  - Kiểm tra đã chạy `deploy:local` và `seed:local` **sau khi** node đã bật.  
  - Kiểm tra `.env.local` đã dán đúng 3 địa chỉ mới từ lần deploy vừa chạy.  
  - MetaMask đang chọn mạng **Localhost 8545** (Chain ID 31337), rồi F5 lại.

- **"ERR_CONNECTION_REFUSED" trong console:**  
  Hardhat node chưa chạy hoặc đã tắt. Mở Terminal 1, chạy lại `npx hardhat node`, rồi refresh trang.

- **Sau khi tắt máy / tắt terminal:**  
  Dữ liệu trên blockchain local sẽ mất. Lần sau muốn demo lại: làm lại từ **Bước 1** (bật node → deploy → cập nhật `.env.local` → seed → `npm run dev`).
