# MiniRARpp - Công cụ nén tệp

Ứng dụng nén/giải nén tệp đơn giản với giao diện thân thiện.

## Tính năng

- **Nén tệp**: Chọn tệp, đặt mức nén, tạo file ZIP
- **Giải nén**: Mở file ZIP và trích xuất nội dung
- **Hàng đợi công việc**: Chạy nhiều tác vụ cùng lúc
- **Tạm dừng/Tiếp tục**: Tạm dừng công việc đang chạy
- **Chọn tệp theo cây**: Giao diện như WinRAR, chọn tệp/thư mục cần nén
- **Mức nén sẵn**: Nhanh, Cân bằng, Tối đa, Chỉ lưu
- **Mật khẩu**: Bảo vệ file ZIP bằng mật khẩu (tính năng đang phát triển)

## Cài đặt

```bash
npm install
cd src-tauri && cargo build
```

## Chạy

```bash
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Cấu trúc

- `src/` - Mã React frontend
- `src-tauri/` - Mã Rust backend
- `src/features/compress/` - Chức năng nén
- `src/extract/` - Chức năng giải nén
- `src/shared/` - Thành phần dùng chung

## Công nghệ

- **Frontend**: React 19 + TypeScript
- **Desktop**: Tauri 2
- **Backend**: Rust + zip crate
