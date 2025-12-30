// 数字转中文大写函数
function numberToChinese(num) {
    if (num === 0) return '零';
    
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿', '兆'];
    
    let str = num.toString();
    let integerPart = str.split('.')[0];
    let decimalPart = str.split('.')[1] || '';
    
    let result = '';
    
    // 处理整数部分
    if (integerPart !== '0') {
        let integerLength = integerPart.length;
        for (let i = 0; i < integerLength; i++) {
            let digit = parseInt(integerPart[i]);
            let unitIndex = (integerLength - 1 - i) % 4;
            let bigUnitIndex = Math.floor((integerLength - 1 - i) / 4);
            
            if (digit === 0) {
                // 连续零只保留一个
                if (result.charAt(result.length - 1) !== '零') {
                    result += '零';
                }
            } else {
                result += digits[digit] + units[unitIndex];
            }
            
            // 添加大单位（万、亿等）
            if (unitIndex === 0 && digit !== 0) {
                result += bigUnits[bigUnitIndex];
            }
        }
        
        // 移除末尾的零
        while (result.charAt(result.length - 1) === '零') {
            result = result.slice(0, -1);
        }
        
        result += '圆';
    } else {
        result += '零圆';
    }
    
    // 处理小数部分
    if (decimalPart.length > 0) {
        let jiao = parseInt(decimalPart[0]) || 0;
        let fen = parseInt(decimalPart[1]) || 0;
        
        if (jiao > 0) {
            result += digits[jiao] + '角';
        }
        
        if (fen > 0) {
            result += digits[fen] + '分';
        }
    } else {
        result += '整';
    }
    
    return result;
}

// 计算单页金额小计
function calculatePageTotal(pageElement) {
    const amountInputs = pageElement.querySelectorAll('.amount-input');
    const amountDisplays = pageElement.querySelectorAll('.amount-display');
    const amountCapitals = pageElement.querySelectorAll('.amount-capital');
    
    let total = 0;
    
    // 更新每个金额显示和大写
    amountInputs.forEach((input, index) => {
        const value = parseFloat(input.value) || 0;
        total += value;
        
        // 更新金额显示
        if (amountDisplays[index]) {
            amountDisplays[index].textContent = value.toFixed(2);
        }
        
        // 更新金额大写
        if (amountCapitals[index]) {
            amountCapitals[index].textContent = numberToChinese(value);
        }
    });
    
    // 更新本页小计
    const pageTotalAmount = pageElement.querySelector('.page-total-amount');
    const pageTotalCapital = pageElement.querySelector('.page-total-capital');
    
    pageTotalAmount.textContent = total.toFixed(2);
    pageTotalCapital.textContent = numberToChinese(total);
    
    return total;
}

// 计算累计总计
function calculateGrandTotal() {
    const pages = document.querySelectorAll('.a4-page');
    let grandTotal = 0;
    
    // 计算所有页面的总计
    pages.forEach(page => {
        grandTotal += parseFloat(calculatePageTotal(page));
    });
    
    // 更新所有页面的累计总计
    const grandTotalAmounts = document.querySelectorAll('.grand-total-amount');
    const grandTotalCapitals = document.querySelectorAll('.grand-total-capital');
    
    grandTotalAmounts.forEach(element => {
        element.textContent = grandTotal.toFixed(2);
    });
    
    grandTotalCapitals.forEach(element => {
        element.textContent = numberToChinese(grandTotal);
    });
}

// 处理金额输入变化
function handleAmountInputChange() {
    // 重新计算金额
    calculateGrandTotal();
    
    // 保存数据到localStorage
    saveToLocalStorage();
}

// 处理其他输入变化
function handleOtherInputChange() {
    saveToLocalStorage();
}

// 添加事件监听器
function addEventListeners() {
    // 金额输入事件
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('amount-input')) {
            handleAmountInputChange.call(e.target);
        } else if (e.target.matches('.name-input, .gift-input, .address-input')) {
            handleOtherInputChange.call(e.target);
        }
    });
    
    // 添加页面按钮
    document.getElementById('addPageBtn').addEventListener('click', addNewPage);
    
    // 保存到本地按钮
    document.getElementById('saveBtn').addEventListener('click', saveToFile);
    
    // 打印按钮
    document.getElementById('printBtn').addEventListener('click', function() {
        window.print();
    });
    
    // 清空所有按钮
    document.getElementById('clearBtn').addEventListener('click', function() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
            localStorage.removeItem('giftBookData');
            location.reload();
        }
    });
}

// 添加新页面
function addNewPage() {
    const mainContent = document.getElementById('mainContent');
    const pageCount = mainContent.children.length + 1;
    
    // 创建新页面
    const newPage = document.createElement('div');
    newPage.className = 'a4-page';
    
    newPage.innerHTML = `
        <div class="book-header">
            <div class="book-title">礼薄</div>
            <div class="page-number">第 ${pageCount} 页</div>
        </div>
        
        <table class="gift-table">
            <!-- 分类标题行 -->
            <thead>
                <tr>
                    <th class="category-header">姓名</th>
                    <th class="category-header">礼金</th>
                    <th class="category-header">礼品</th>
                    <th class="category-header">地址</th>
                    <th class="category-header">大写</th>
                    <th class="category-header">金额</th>
                    <!-- 8个序号列 -->
                    <th class="serial-number">1</th>
                    <th class="serial-number">2</th>
                    <th class="serial-number">3</th>
                    <th class="serial-number">4</th>
                    <th class="serial-number">5</th>
                    <th class="serial-number">6</th>
                    <th class="serial-number">7</th>
                    <th class="serial-number">8</th>
                    <!-- 页小计和累计总计 -->
                    <th class="summary-header">本页小计</th>
                    <th class="summary-header">累计总计</th>
                </tr>
            </thead>
            
            <!-- 数据行：姓名 -->
            <tbody>
                <tr>
                    <td class="data-label">姓名</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td><input type="text" class="name-input" placeholder="请输入"></td>
                    <td></td>
                    <td></td>
                </tr>
                
                <!-- 数据行：礼金小写 -->
                <tr>
                    <td class="data-label">礼金</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td><input type="number" class="amount-input" placeholder="0"></td>
                    <td></td>
                    <td></td>
                </tr>
                
                <!-- 数据行：礼金大写 -->
                <tr>
                    <td class="data-label">大写</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="amount-capital"></td>
                    <td class="page-total-capital"></td>
                    <td class="grand-total-capital"></td>
                </tr>
                
                <!-- 数据行：礼品 -->
                <tr>
                    <td class="data-label">礼品</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td><input type="text" class="gift-input" placeholder="请输入"></td>
                    <td></td>
                    <td></td>
                </tr>
                
                <!-- 数据行：地址 -->
                <tr>
                    <td class="data-label">地址</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td><input type="text" class="address-input" placeholder="请输入"></td>
                    <td></td>
                    <td></td>
                </tr>
                
                <!-- 数据行：金额总计 -->
                <tr>
                    <td class="data-label">金额</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="amount-display">0</td>
                    <td class="page-total-amount">0</td>
                    <td class="grand-total-amount">0</td>
                </tr>
            </tbody>
        </table>
    `;
    
    mainContent.appendChild(newPage);
    
    // 更新所有页面的累计总计
    calculateGrandTotal();
    
    // 保存数据到localStorage
    saveToLocalStorage();
}

// 保存数据到localStorage
function saveToLocalStorage() {
    const pages = document.querySelectorAll('.a4-page');
    const data = [];
    
    pages.forEach((page, pageIndex) => {
        const nameInputs = page.querySelectorAll('.name-input');
        const amountInputs = page.querySelectorAll('.amount-input');
        const giftInputs = page.querySelectorAll('.gift-input');
        const addressInputs = page.querySelectorAll('.address-input');
        
        const pageData = {
            pageNumber: pageIndex + 1,
            rows: []
        };
        
        // 保存8条记录
        for (let i = 0; i < 8; i++) {
            pageData.rows.push({
                name: nameInputs[i] ? nameInputs[i].value : '',
                amount: amountInputs[i] ? amountInputs[i].value : '',
                gift: giftInputs[i] ? giftInputs[i].value : '',
                address: addressInputs[i] ? addressInputs[i].value : ''
            });
        }
        
        data.push(pageData);
    });
    
    localStorage.setItem('giftBookData', JSON.stringify(data));
}

// 从localStorage加载数据
function loadFromLocalStorage() {
    const data = localStorage.getItem('giftBookData');
    if (!data) return;
    
    const parsedData = JSON.parse(data);
    const mainContent = document.getElementById('mainContent');
    
    // 清空现有页面（保留第一页模板）
    while (mainContent.children.length > 1) {
        mainContent.removeChild(mainContent.lastChild);
    }
    
    // 填充数据到页面
    parsedData.forEach((pageData, pageIndex) => {
        let page;
        if (pageIndex === 0) {
            // 使用第一页
            page = mainContent.children[0];
        } else {
            // 创建新页面
            addNewPage();
            page = mainContent.children[pageIndex];
        }
        
        // 更新页码
        const pageNumber = page.querySelector('.page-number');
        pageNumber.textContent = `第 ${pageData.pageNumber} 页`;
        
        const nameInputs = page.querySelectorAll('.name-input');
        const amountInputs = page.querySelectorAll('.amount-input');
        const giftInputs = page.querySelectorAll('.gift-input');
        const addressInputs = page.querySelectorAll('.address-input');
        
        // 填充行数据
        pageData.rows.forEach((rowData, rowIndex) => {
            if (nameInputs[rowIndex]) {
                nameInputs[rowIndex].value = rowData.name;
            }
            if (amountInputs[rowIndex]) {
                amountInputs[rowIndex].value = rowData.amount;
            }
            if (giftInputs[rowIndex]) {
                giftInputs[rowIndex].value = rowData.gift;
            }
            if (addressInputs[rowIndex]) {
                addressInputs[rowIndex].value = rowData.address;
            }
        });
    });
    
    // 计算所有金额
    calculateGrandTotal();
}

// 保存到本地文件
function saveToFile() {
    const data = localStorage.getItem('giftBookData');
    if (!data) {
        alert('没有数据可以保存！');
        return;
    }
    
    // 创建下载链接
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `礼薄_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('保存成功！');
}

// 初始化应用
function init() {
    addEventListeners();
    loadFromLocalStorage();
    calculateGrandTotal();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);