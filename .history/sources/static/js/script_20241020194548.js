// Truy vấn các phần tử DOM từ UI
const dropArea = document.querySelector('.drag-area'); // Vùng kéo-thả file
const dragText = document.querySelector('.header'); // Tiêu đề trong vùng kéo-thả

let button = dropArea.querySelector('.button'); // Nút để mở hộp thoại chọn file
let input = dropArea.querySelector('input'); // Trường input để tải file

let file; // Biến lưu trữ tệp được chọn hoặc kéo-thả
let dataExtracted; // Biến lưu trữ dữ liệu sau khi trích xuất từ ảnh

// Các phần tử điều khiển sidebar (menu điều hướng)
let menu_btn = document.querySelector("#menu-btn"); // Nút mở/đóng sidebar
let sidebar = document.querySelector(".sidebar"); // Sidebar điều hướng
let search_btn = document.querySelector(".bx-search-alt-2"); // Nút tìm kiếm

let imgForm = document.querySelector(".get_img"); // Biểu mẫu tải ảnh

// Xử lý sự kiện nhấp vào nút mở/đóng sidebar
menu_btn.onclick = function() {
  sidebar.classList.toggle("active"); // Toggle trạng thái "active" của sidebar
}

// Xử lý sự kiện nhấp vào nút tìm kiếm (mở/đóng sidebar)
search_btn.onclick = function() {
  sidebar.classList.toggle("active"); // Toggle trạng thái "active" của sidebar
}

// Xử lý sự kiện nhấp vào nút để mở hộp thoại chọn file
button.onclick = () => {
  input.click(); // Kích hoạt sự kiện click trên input file
};

// Hiển thị overlay loading khi bắt đầu tải file
function loading_on() {
  document.querySelector('.overlay').style.display = "block";
}

// Tắt overlay loading khi hoàn tất tải file
function loading_off() {
  document.querySelector('.overlay').style.display = "none";
}

// Sự kiện khi người dùng chọn file thông qua hộp thoại
input.addEventListener('change', function() {
  file = this.files[0]; // Lấy file từ input
  dropArea.classList.add('active'); // Thêm lớp active khi có file
  displayFile(); // Hiển thị file được chọn
});

// Xử lý khi file được kéo vào vùng kéo-thả
dropArea.addEventListener('dragover', (event) => {
  event.preventDefault(); // Ngăn chặn hành động mặc định của trình duyệt
  dropArea.classList.add('active'); // Thêm lớp active khi file đang được kéo vào
  dragText.textContent = 'Release to Upload'; // Cập nhật nội dung thông báo
});

// Xử lý khi file rời khỏi vùng kéo-thả
dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('active'); // Xóa lớp active khi file rời khỏi vùng
  dragText.textContent = 'Drag & Drop'; // Cập nhật lại nội dung ban đầu
});

// Xử lý khi file được thả vào vùng kéo-thả
dropArea.addEventListener('drop', (event) => {
  event.preventDefault(); // Ngăn hành động mặc định của trình duyệt
  file = event.dataTransfer.files[0]; // Lấy file đầu tiên trong danh sách file thả vào
  displayFile(); // Hiển thị file được chọn
});

// Xử lý logic trích xuất thông tin từ ảnh sau khi file được tải lên
const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function(e) {
  e.preventDefault();

  if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
    loading_off(); // Tắt loading sau khi xử lý thành công
    const data = JSON.parse(xhr.responseText).data; // Lấy dữ liệu từ phản hồi
    const update = new Date(); // Lấy thời gian hiện tại để cập nhật ảnh tránh cache
    // Cập nhật giao diện với thông tin trích xuất từ ảnh
    document.querySelector('.person__img').innerHTML = `<img src="/static/results/0.jpg?v=${update.getTime()}" />`;
    document.querySelector('.info__id').innerHTML = `Số (ID): ${data[0]}`;
    document.querySelector('.info__name').innerHTML = `Họ và tên (Full name): ${data[1]}`;
    document.querySelector('.info__date').innerHTML = `Ngày sinh (Date of birth): ${data[2]}`;
    document.querySelector('.info__sex').innerHTML = `Giới tính (Sex): ${data[3]}`;
    document.querySelector('.info__nation').innerHTML = `Quốc tịch (Nationality): ${data[4]}`;
    document.querySelector('.info__hometown').innerHTML = `Quê quán (Place of origin): ${data[5]}`;
    document.querySelector('.info__address').innerHTML = `Nơi thường trú (Place of residence): ${data[6]}`;
    document.querySelector('.info__doe').innerHTML = `Ngày hết hạn (Date of expiry) : ${data[7]}`;
    // Lưu dữ liệu trích xuất vào biến dataExtracted để xử lý tiếp theo
    dataExtracted = [{
      id: data[0],
      name: data[1],
      date_of_birth: data[2],
      sex: data[3],
      nationality: data[4],
      hometown: `"${data[5]}"`,
      address: `"${data[6]}"`,
      date_of_expiry: data[7]
    }];
    // Thông báo thành công
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Extract successfully!',
      footer: `CODE: ${xhr.status}`
    })
  }
  // Xử lý lỗi khi gặp sự cố
  else if (xhr.status >= 400 && xhr.status <= 500){
    const data = JSON.parse(xhr.responseText);
    loading_off();
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: String(data.message),
      footer: `CODE: ${xhr.status}`
    })
  }
  // Xử lý khi dữ liệu đã tải xuống
  else if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 201){
    downloadCSV({
      filename: "user_data.csv"
    });
    const downloadSuccess = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })

    downloadSuccess.fire({
      icon: 'success',
      title: 'Download extracted data successfully!'
    })
  }
}

// Kiểm tra và xử lý nếu file không hợp lệ
function file_validation() {
  if (file == 'wrong_exts') {
    const URL = '/uploader';
    const formData = new FormData();
    var f = new File([""], "WRONG_EXTS"); // Trick sử dụng file rỗng để gửi
    formData.append('file', f);
    xhr.open('POST', URL, true);
    xhr.send(formData);
  }
}

// Xử lý sự kiện submit form tải ảnh
imgForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const formData = new FormData();
  loading_on(); // Hiển thị overlay loading

  if (file == null) {
    var f = new File([""], "NULL"); // Trick sử dụng file rỗng khi không có file
    formData.append('file', f);
  } else {
    formData.append('file', file); // Gửi file người dùng đã chọn hoặc kéo thả
  }
  const URL = '/uploader'; // URL endpoint xử lý file tải lên
  xhr.open('POST', URL, true); // Gửi request POST với file
  xhr.send(formData);
});

// Chuyển đổi dữ liệu thành CSV
convertArrayOfObjectsToCSV = args => {
  const data = args.data;
  if (!data || !data.length) return;

  const columnDelimiter = args.columnDelimiter || ',';
  const lineDelimiter = args.lineDelimiter || '\n';

  const keys = Object.keys(data[0]);

  let result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(item => {
    ctr = 0;
    keys.forEach(key => {
      if (ctr > 0) result += columnDelimiter;
      result += item[key];
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
}

// Gửi yêu cầu tải xuống dữ liệu trích xuất
function downloadExtracted() {
  const URL = '/download';
  const formData = new FormData();
  formData.append('file', dataExtracted); // Đính kèm dữ liệu trích xuất
  xhr.open('POST', URL, true);
  xhr.send(formData);
}

// Tạo và tải file CSV
downloadCSV = args => {
  let csv = convertArrayOfObjectsToCSV({
    data: dataExtracted
  });
  if (!csv) return;

  const filename = args.filename || 'export.csv';

  if (!csv.match(/^data:text\/csv/i)) {
    csv = 'data:text/csv;charset=utf-8,' + csv;
  }

  const data = encodeURI(csv);

  const link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.click();
}

// Hiển thị file được chọn dưới dạng hình ảnh
function displayFile() {
  let fileType = file.type; // Lấy kiểu file

  // Các loại tệp hợp lệ
  let validExtensions = ['image/jpeg', 'image/jpg', 'image/png'];

  if (validExtensions.includes(fileType)) {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      let fileURL = fileReader.result; // Lấy URL của ảnh
      dropArea.innerHTML = `<img src="${fileURL}" alt="Image" />`; // Hiển thị ảnh trong vùng kéo-thả
    };
    fileReader.readAsDataURL(file); // Đọc dữ liệu ảnh
  } else {
    alert('This is not an Image File!'); // Cảnh báo nếu không phải ảnh
    dropArea.classList.remove('active'); // Xóa lớp active
    dragText.textContent = 'Drag & Drop'; // Cập nhật lại nội dung ban đầu
  }
}
