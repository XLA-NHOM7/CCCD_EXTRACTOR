// Mảng lưu trữ thông tin CCCD
let cccdHistory = JSON.parse(localStorage.getItem('cccdHistory')) || [];

// Hàm hiển thị lịch sử trên bảng
function displayHistory() {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = ''; // Xóa bảng trước khi cập nhật

  cccdHistory.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.date_of_birth}</td>
      <td>${item.sex}</td>
      <td>
        <button onclick="editCCCD(${index})">Sửa</button>
        <button onclick="deleteCCCD(${index})">Xóa</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Hàm xóa một mục CCCD
function deleteCCCD(index) {
  cccdHistory.splice(index, 1);
  localStorage.setItem('cccdHistory', JSON.stringify(cccdHistory));
  displayHistory();
}

// Hàm sửa thông tin CCCD
function editCCCD(index) {
  const newName = prompt('Nhập họ và tên mới:', cccdHistory[index].name);
  const newDate = prompt('Nhập ngày sinh mới:', cccdHistory[index].date_of_birth);
  const newSex = prompt('Nhập giới tính mới:', cccdHistory[index].sex);

  if (newName && newDate && newSex) {
    cccdHistory[index].name = newName;
    cccdHistory[index].date_of_birth = newDate;
    cccdHistory[index].sex = newSex;

    localStorage.setItem('cccdHistory', JSON.stringify(cccdHistory));
    displayHistory();
  }
}

// Hiển thị bảng lịch sử khi trang được tải
window.onload = displayHistory;
