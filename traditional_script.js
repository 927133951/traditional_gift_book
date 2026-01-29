// 数字遗产档案 - 礼薄书功能脚本

class GiftArchive {
    constructor() {
        this.currentPage = 1;
        this.recordsPerPage = 8;
        this.archiveData = this.loadArchiveData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTable();
        this.updateDateDisplay();
        this.calculateTotals();
        this.setupAutoSave();
        
        // 初始化时执行金额转换验证和计算
        this.validateAndConvertAmounts();
        this.calculateTotals();
        
        // 确保至少有一页，并强制刷新
        const totalPages = Math.max(1, Math.ceil(Object.keys(this.archiveData.records || {}).length / this.recordsPerPage));
        if (totalPages === 1 && Object.keys(this.archiveData.records || {}).length === 0) {
            this.addNewPage();
        }
        
        // 延迟执行确保DOM完全加载
        setTimeout(() => {
            this.calculateTotals();
        }, 100);
    }

    // 设置事件监听器 - 修复交互事件
    setupEventListeners() {
        document.getElementById('eventTitle').addEventListener('input', (e) => this.saveMetaData());
        document.getElementById('eventLocation').addEventListener('input', (e) => this.saveMetaData());
        
        // 监听所有输入框的变化
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('record-input')) {
                this.handleRecordInput(e);
                this.calculateTotals(); // 实时计算金额
            }
        });
    }

    // 初始化表格 - 垂直堆叠版本
    initializeTable() {
        const tablesContainer = document.getElementById('tablesContainer');
        tablesContainer.innerHTML = '';
        
        // 创建所有需要的表格
        const totalPages = Math.max(1, Math.ceil(Object.keys(this.archiveData.records || {}).length / this.recordsPerPage));
        
        for (let page = 1; page <= totalPages; page++) {
            this.createNewTable(page);
        }
        
        // 如果没有表格，创建第一个
        if (totalPages === 0) {
            this.createNewTable(1);
        }
        
        // 加载所有数据
        this.loadAllTables();
    }
    
    // 创建新表格
    createNewTable(pageNumber) {
        const tablesContainer = document.getElementById('tablesContainer');
        
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-section';
        tableWrapper.dataset.page = pageNumber;
        
        const table = document.createElement('table');
        table.className = 'record-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="col-name">宾客姓名</th>
                    <th class="col-amount">礼金</th>
                    <th class="col-amount-capital">礼金大写</th>
                    <th class="col-gift">礼品</th>
                    <th class="col-address">地址</th>
                </tr>
            </thead>
            <tbody class="table-body" data-page="${pageNumber}">
                <!-- 动态生成行 -->
            </tbody>
            <tfoot class="table-summary">
                <tr class="summary-row">
                    <th class="summary-header">本页小计</th>
                    <td colspan="2" class="summary-value" data-page="${pageNumber}" data-type="pageTotal">¥0.00</td>
                    <th class="summary-header">总计</th>
                    <td class="summary-value" data-type="grandTotal">¥0.00</td>
                </tr>
            </tfoot>
        `;
        
        // 创建行
        const tbody = table.querySelector('.table-body');
        for (let i = 0; i < this.recordsPerPage; i++) {
            const row = this.createTableRow(pageNumber, i);
            tbody.appendChild(row);
        }
        
        tableWrapper.appendChild(table);
        tablesContainer.appendChild(tableWrapper);
    }

    // 创建表格行
    createTableRow(pageNumber, rowIndex) {
        const row = document.createElement('tr');
        const actualIndex = (pageNumber - 1) * this.recordsPerPage + rowIndex;
        
        row.innerHTML = `
            <td class="col-name">
                <input type="text" class="record-input" data-field="name" data-index="${actualIndex}"
                       placeholder="请输入宾客姓名">
            </td>
            <td class="col-amount">
                <input type="number" class="record-input" data-field="amount" data-index="${actualIndex}"
                       placeholder="0.00" step="0.01" min="0">
            </td>
            <td class="col-amount-capital">
                <input type="text" class="record-input" data-field="amountCapital" data-index="${actualIndex}"
                       placeholder="自动转换大写金额" readonly>
            </td>
            <td class="col-gift">
                <input type="text" class="record-input" data-field="gift" data-index="${actualIndex}"
                       placeholder="请输入礼品">
            </td>
            <td class="col-address">
                <input type="text" class="record-input" data-field="address" data-index="${actualIndex}"
                       placeholder="请输入地址">
            </td>
        `;

        return row;
    }



    // 金额转中文大写
    amountToChinese(amount) {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return '';
        
        const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        const units = ['', '拾', '佰', '仟'];
        const bigUnits = ['', '万', '亿', '兆'];
        const decimals = ['角', '分'];
        
        try {
            amount = parseFloat(amount).toFixed(2);
            const [integer, decimal] = amount.split('.');
            
            let result = '';
            
            // 处理整数部分
            if (integer > 0) {
                const intStr = integer.toString();
                const len = intStr.length;
                let parts = [];
                
                // 按4位一组处理
                for (let i = 0; i < len; i += 4) {
                    const part = intStr.slice(Math.max(0, len - i - 4), len - i);
                    if (part) {
                        parts.unshift(part);
                    }
                }
                
                parts.forEach((part, partIndex) => {
                    let partStr = '';
                    const partLen = part.length;
                    
                    for (let j = 0; j < partLen; j++) {
                        const digit = parseInt(part[j]);
                        const pos = partLen - j - 1;
                        
                        if (digit !== 0) {
                            partStr += digits[digit] + units[pos];
                        } else {
                            if (partStr.slice(-1) !== '零') {
                                partStr += '零';
                            }
                        }
                    }
                    
                    partStr = partStr.replace(/零+$/, '');
                    if (partStr) {
                        result += partStr + bigUnits[parts.length - 1 - partIndex];
                    }
                });
                
                result = result.replace(/零+$/, '').replace(/零{2,}/g, '零') + '元';
            }
            
            // 处理小数部分
            if (decimal && decimal !== '00') {
                for (let i = 0; i < decimal.length; i++) {
                    const digit = parseInt(decimal[i]);
                    if (digit !== 0) {
                        result += digits[digit] + decimals[i];
                    }
                }
            } else {
                result += '整';
            }
            
            return result.replace(/^零+/, '');
        } catch (error) {
            console.error('金额转换错误:', error);
            return '';
        }
    }

    // 处理记录输入 - 垂直堆叠版本
    handleRecordInput(event) {
        const input = event.target;
        const field = input.dataset.field;
        const actualIndex = parseInt(input.dataset.index);
        const row = input.closest('tr');

        if (field === 'amount') {
            const amount = parseFloat(input.value) || 0;
            const capitalInput = row.querySelector('[data-field="amountCapital"]');
            capitalInput.value = this.amountToChinese(amount);
            
            // 同时保存大写金额
            this.saveRecordData(actualIndex, 'amountCapital', capitalInput.value);
        }

        this.saveRecordData(actualIndex, field, input.value);
        this.calculateTotals();
    }

    // 保存记录数据
    saveRecordData(index, field, value) {
        if (!this.archiveData.records) {
            this.archiveData.records = {};
        }
        
        if (!this.archiveData.records[index]) {
            this.archiveData.records[index] = {};
        }
        
        this.archiveData.records[index][field] = value;
        this.saveArchiveData();
    }

    // 保存元数据
    saveMetaData() {
        this.archiveData.meta = {
            eventTitle: document.getElementById('eventTitle').value,
            eventLocation: document.getElementById('eventLocation').value,
            createDate: new Date().toLocaleDateString('zh-CN'),
            archiveNumber: `LB-${new Date().getFullYear()}-${String(this.currentPage).padStart(3, '0')}`
        };
        this.saveArchiveData();
    }

    // 加载所有表格数据
    loadAllTables() {
        const records = this.archiveData.records || {};
        
        // 加载所有表格
        const tableSections = document.querySelectorAll('.table-section');
        tableSections.forEach((section, sectionIndex) => {
            const pageNumber = sectionIndex + 1;
            const tbody = section.querySelector('.table-body');
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, rowIndex) => {
                const actualIndex = (pageNumber - 1) * this.recordsPerPage + rowIndex;
                const record = records[actualIndex] || {};
                
                // 先加载所有数据
                Object.keys(record).forEach(field => {
                    const input = row.querySelector(`[data-field="${field}"]`);
                    if (input) {
                        input.value = record[field];
                    }
                });
                
                // 确保金额大写转换
                const amountInput = row.querySelector('[data-field="amount"]');
                const capitalInput = row.querySelector('[data-field="amountCapital"]');
                if (amountInput && capitalInput) {
                    const amount = parseFloat(amountInput.value) || 0;
                    if (amount > 0 && !capitalInput.value) {
                        capitalInput.value = this.amountToChinese(amount);
                        // 保存转换后的大写金额
                        this.saveRecordData(actualIndex, 'amountCapital', capitalInput.value);
                    }
                }
            });
        });

        // 加载元数据
        if (this.archiveData.meta) {
            document.getElementById('eventTitle').value = this.archiveData.meta.eventTitle || '';
            document.getElementById('eventLocation').value = this.archiveData.meta.eventLocation || '';
        }
        
        // 计算所有总计
        this.calculateTotals();
    }

    // 计算所有表格的小计和总计
    calculateTotals() {
        const records = this.archiveData.records || {};
        const grandTotal = this.calculateGrandTotal(records);
        
        // 计算每个表格的小计
        const tableSections = document.querySelectorAll('.table-section');
        tableSections.forEach((section, sectionIndex) => {
            const pageNumber = sectionIndex + 1;
            const pageTotal = this.calculatePageTotal(records, pageNumber);
            
            // 更新本页小计
            const pageTotalEl = section.querySelector(`[data-type="pageTotal"]`);
            if (pageTotalEl) {
                pageTotalEl.textContent = `¥${pageTotal.toFixed(2)}`;
                pageTotalEl.style.color = '#C8102E';
                pageTotalEl.style.fontWeight = 'bold';
            }
            
            // 更新总计
            const grandTotalEl = section.querySelector(`[data-type="grandTotal"]`);
            if (grandTotalEl) {
                grandTotalEl.textContent = `¥${grandTotal.toFixed(2)}`;
                grandTotalEl.style.color = '#C8102E';
                grandTotalEl.style.fontWeight = 'bold';
            }
        });
        
        console.log(`金额计算: 总计=¥${grandTotal.toFixed(2)}`);
    }
    
    // 计算单页金额
    calculatePageTotal(records, pageNumber) {
        let pageTotal = 0;
        const startIndex = (pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        
        for (let i = startIndex; i < endIndex; i++) {
            const record = records[i] || {};
            const amount = parseFloat(record.amount) || 0;
            pageTotal += amount;
        }
        
        return pageTotal;
    }
    
    // 计算总计金额
    calculateGrandTotal(records) {
        let grandTotal = 0;
        Object.keys(records).forEach(key => {
            const record = records[key];
            const amount = parseFloat(record.amount) || 0;
            grandTotal += amount;
        });
        
        return grandTotal;
    }
    
    // 强制重新计算当前页金额
    calculateCurrentPageTotals() {
        // 强制刷新表格数据
        this.loadPageData();
        
        // 延迟执行确保DOM更新
        setTimeout(() => {
            this.calculateTotals();
        }, 50);
    }

    // 更新日期显示
    updateDateDisplay() {
        const today = new Date();
        const chineseDate = today.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('createDate').textContent = chineseDate;
        this.updateTraditionalDate();
    }
    
    // 更新传统日期（包含时辰、年份生肖、月份生肖、日期生肖）
    updateTraditionalDate() {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1; // 月份从0开始，需要+1
            const day = today.getDate();
            
            // 获取中文数字年份（简化格式，如2025显示为二〇二五）
            const chineseYear = this.numberToChinese(year);
            
            // 获取当前时辰
            const hour = this.getTimeHour(today);
            
            // 获取年份所属生肖
            const yearZodiac = this.getZodiac(year);
            
            // 获取月份所属生肖（月份地支对应的生肖）
            const monthZodiac = this.getMonthZodiac(month);
            
            // 获取日期所属生肖（日期地支对应的生肖）
            const dayZodiac = this.getDayZodiac(year, month, day);
            
            // 更新页面显示（严格遵循"年份 生肖年 生肖月 生肖日 时辰"的顺序）
            const subtitleElement = document.querySelector('.archive-subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = `${chineseYear}年 ${yearZodiac}年 ${monthZodiac}月 ${dayZodiac}日 ${hour}`;
            }
        } catch (error) {
            console.error('更新传统日期失败:', error);
            // 错误处理：使用默认显示
            const subtitleElement = document.querySelector('.archive-subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = `${new Date().getFullYear()}年`;
            }
        }
    }
    
    // 数字转中文（简化格式，如2025显示为二〇二五）
    numberToChinese(num) {
        const chineseDigits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        
        if (num === 0) return '〇';
        
        let str = num.toString();
        let result = '';
        
        for (let i = 0; i < str.length; i++) {
            const digit = parseInt(str[i]);
            result += chineseDigits[digit];
        }
        
        return result;
    }
    
    // 获取干支纪年
    getGanZhi(year) {
        // 天干
        const tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        // 地支
        const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        
        // 计算天干：(年份 - 4) % 10
        const tgIndex = (year - 4) % 10;
        // 计算地支：(年份 - 4) % 12
        const dzIndex = (year - 4) % 12;
        
        return tiangan[tgIndex] + dizhi[dzIndex];
    }
    
    // 获取生肖
    getZodiac(year) {
        const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        // 计算生肖：(年份 - 4) % 12
        const zodiacIndex = (year - 4) % 12;
        return zodiacs[zodiacIndex];
    }
    
    // 获取月份所属生肖（月份地支对应的生肖）
    getMonthZodiac(month) {
        // 月份对应的地支和生肖
        const monthZodiacs = [
            { month: 1, zodiac: '虎' },
            { month: 2, zodiac: '兔' },
            { month: 3, zodiac: '龙' },
            { month: 4, zodiac: '蛇' },
            { month: 5, zodiac: '马' },
            { month: 6, zodiac: '羊' },
            { month: 7, zodiac: '猴' },
            { month: 8, zodiac: '鸡' },
            { month: 9, zodiac: '狗' },
            { month: 10, zodiac: '猪' },
            { month: 11, zodiac: '鼠' },
            { month: 12, zodiac: '牛' }
        ];
        
        const monthInfo = monthZodiacs.find(item => item.month === month);
        return monthInfo ? monthInfo.zodiac : '鼠'; // 默认返回鼠
    }
    
    // 获取日期所属生肖（日期地支对应的生肖）
    getDayZodiac(year, month, day) {
        // 简化实现：使用日期对12取模来计算生肖
        // 更准确的实现需要计算当天的干支，但这需要复杂的天文算法
        // 这里使用简化的计算方式
        const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        
        // 使用日期作为基础，加上月份和年份的影响来计算
        const dayCode = year + month + day;
        const zodiacIndex = dayCode % 12;
        
        return zodiacs[zodiacIndex];
    }
    
    // 获取当前时辰
    getTimeHour(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        
        // 时辰对应表（每两小时一个时辰）
        const timeHours = [
            { name: '子时', start: 0, end: 120 },
            { name: '丑时', start: 120, end: 240 },
            { name: '寅时', start: 240, end: 360 },
            { name: '卯时', start: 360, end: 480 },
            { name: '辰时', start: 480, end: 600 },
            { name: '巳时', start: 600, end: 720 },
            { name: '午时', start: 720, end: 840 },
            { name: '未时', start: 840, end: 960 },
            { name: '申时', start: 960, end: 1080 },
            { name: '酉时', start: 1080, end: 1200 },
            { name: '戌时', start: 1200, end: 1320 },
            { name: '亥时', start: 1320, end: 1440 }
        ];
        
        // 查找当前时辰
        for (const timeHour of timeHours) {
            if (totalMinutes >= timeHour.start && totalMinutes < timeHour.end) {
                return timeHour.name;
            }
        }
        
        // 默认返回子时
        return '子时';
    }

    // 新增一页 - 修复版本
    addNewPage() {
        // 确保archiveData.records存在
        if (!this.archiveData.records) {
            this.archiveData.records = {};
        }
        
        // 计算新页码
        const currentRecords = Object.keys(this.archiveData.records).length;
        const totalPages = Math.ceil(currentRecords / this.recordsPerPage);
        const newPageNumber = totalPages + 1;
        
        // 为新页创建空记录
        const newPageStart = totalPages * this.recordsPerPage;
        for (let i = 0; i < this.recordsPerPage; i++) {
            const recordIndex = newPageStart + i;
            this.archiveData.records[recordIndex] = {
                name: '',
                address: '',
                amount: '',
                amountCapital: '',
                gift: ''
            };
        }
        
        // 创建新表格
        this.createNewTable(newPageNumber);
        
        // 保存数据
        this.saveArchiveData();
        
        // 更新金额总计
        this.calculateTotals();
        
        console.log(`新增页面: 页码=${newPageNumber}, 总记录数=${Object.keys(this.archiveData.records).length}`);
    }
    
    // 删除页面
    deletePage() {
        // 确保archiveData.records存在
        if (!this.archiveData.records) {
            this.archiveData.records = {};
        }
        
        // 计算当前页数
        const currentRecords = Object.keys(this.archiveData.records).length;
        const totalPages = Math.ceil(currentRecords / this.recordsPerPage);
        
        // 不能删除最后一页
        if (totalPages <= 1) {
            alert('不能删除最后一页');
            return;
        }
        
        // 创建页面选择对话框
        let pageOptions = '';
        for (let i = 1; i <= totalPages; i++) {
            pageOptions += `<option value="${i}">第 ${i} 页</option>`;
        }
        
        const pageSelectHTML = `
            <div style="margin: 10px 0;">
                <label for="pageSelect" style="display: block; margin-bottom: 5px;">请选择要删除的页面：</label>
                <select id="pageSelect" style="padding: 5px; width: 100%;">
                    ${pageOptions}
                </select>
            </div>
        `;
        
        // 创建临时对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            width: 300px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin-top: 0;">删除页面</h3>
            ${pageSelectHTML}
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
                <button id="cancelBtn" style="padding: 8px 15px; background: #ccc; border: none; border-radius: 3px; cursor: pointer;">取消</button>
                <button id="confirmBtn" style="padding: 8px 15px; background: #C8102E; color: white; border: none; border-radius: 3px; cursor: pointer;">删除</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 取消按钮事件
        dialog.querySelector('#cancelBtn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // 确认删除按钮事件
        dialog.querySelector('#confirmBtn').addEventListener('click', () => {
            const pageSelect = dialog.querySelector('#pageSelect');
            const pageToDelete = parseInt(pageSelect.value);
            
            // 二次确认
            if (confirm(`确定要删除第 ${pageToDelete} 页吗？`)) {
                // 删除选中页面的记录
                const startIndexToDelete = (pageToDelete - 1) * this.recordsPerPage;
                const endIndexToDelete = startIndexToDelete + this.recordsPerPage;
                
                // 先删除记录
                for (let i = startIndexToDelete; i < endIndexToDelete; i++) {
                    delete this.archiveData.records[i];
                }
                
                // 重新索引剩余记录，确保连续性
                const remainingRecords = {};
                let newIndex = 0;
                
                Object.keys(this.archiveData.records).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
                    remainingRecords[newIndex++] = this.archiveData.records[key];
                });
                
                this.archiveData.records = remainingRecords;
                
                // 重新生成所有表格
                this.initializeTable();
                
                // 保存数据
                this.saveArchiveData();
                
                console.log(`删除页面: 已删除第 ${pageToDelete} 页, 剩余页数=${Math.ceil(Object.keys(this.archiveData.records).length / this.recordsPerPage)}, 总记录数=${Object.keys(this.archiveData.records).length}`);
            }
            
            document.body.removeChild(dialog);
        });
    }

    // 移除旧的分页方法，使用垂直堆叠布局
    // 所有分页导航已简化为仅新增页面功能

    // 移除旧的分页方法，使用垂直堆叠布局
    // 所有分页导航已简化为仅新增页面功能

    // 移除旧的分页方法，使用垂直堆叠布局
    // 所有分页导航已简化为仅新增页面功能

    // 移除旧的分页方法，使用垂直堆叠布局
    // 所有分页导航已简化为仅新增页面功能

    // 保存档案数据
    saveArchiveData() {
        localStorage.setItem('giftArchive', JSON.stringify(this.archiveData));
    }

    // 加载档案数据
    loadArchiveData() {
        const saved = localStorage.getItem('giftArchive');
        return saved ? JSON.parse(saved) : {};
    }

    // 设置自动保存
    setupAutoSave() {
        setInterval(() => {
            this.saveMetaData();
        }, 30000); // 每30秒自动保存
    }

    // 导出到Word
    exportToWord() {
        const content = this.generateWordContent();
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `电子礼薄书_${new Date().toISOString().split('T')[0]}.doc`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 生成Word内容
    generateWordContent() {
        const title = document.querySelector('.archive-title').textContent;
        const subtitle = document.querySelector('.archive-subtitle').textContent;
        const eventTitle = document.getElementById('eventTitle').value;
        const eventLocation = document.getElementById('eventLocation').value;
        
        let content = `<html><head><meta charset="utf-8"><title>${title}</title></head><body>`;
        content += `<h1 style="text-align: center; color: #C8102E;">${title}</h1>`;
        content += `<p style="text-align: center; color: #666;">${subtitle}</p>`;
        content += `<p><strong>礼事主题：</strong>${eventTitle}</p>`;
        content += `<p><strong>地点：</strong>${eventLocation}</p>`;
        content += `<p><strong>日期：</strong>${document.getElementById('createDate').textContent}</p>`;
        
        content += '<table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
        content += '<thead><tr>';
        content += '<th style="padding: 8px;">宾客姓名</th>';
        content += '<th style="padding: 8px;">礼金</th>';
        content += '<th style="padding: 8px;">礼金大写</th>';
        content += '<th style="padding: 8px;">礼品</th>';
        content += '<th style="padding: 8px;">地址</th>';
        content += '</tr></thead><tbody>';

        const records = this.archiveData.records || {};
        Object.keys(records).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
            const record = records[key];
            content += '<tr>';
            content += `<td style="padding: 8px;">${record.name || ''}</td>`;
            content += `<td style="padding: 8px;">${record.amount || ''}</td>`;
            content += `<td style="padding: 8px;">${record.amountCapital || ''}</td>`;
            content += `<td style="padding: 8px;">${record.gift || ''}</td>`;
            content += `<td style="padding: 8px;">${record.address || ''}</td>`;
            content += '</tr>';
        });

        content += '</tbody></table>';
        // 计算总计金额用于Word导出
        const grandTotal = this.calculateGrandTotal(this.archiveData.records || {});
        content += `<p style="text-align: right; margin-top: 20px;"><strong>总计：¥${grandTotal.toFixed(2)}</strong></p>`;
        content += '</body></html>';
        
        return content;
    }

    // 打印档案
    printArchive() {
        // 保存当前数据
        this.saveArchiveData();
        
        // 触发浏览器打印
        window.print();
    }

    // 保存档案
    saveArchive() {
        this.saveArchiveData();
        alert('档案已保存到本地存储');
    }

    // 验证并转换所有金额
    validateAndConvertAmounts() {
        const records = this.archiveData.records || {};
        let hasChanges = false;
        
        Object.keys(records).forEach(key => {
            const record = records[key];
            const amount = parseFloat(record.amount) || 0;
            const currentCapital = record.amountCapital || '';
            const expectedCapital = amount > 0 ? this.amountToChinese(amount) : '';
            
            if (amount > 0 && currentCapital !== expectedCapital) {
                record.amountCapital = expectedCapital;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.saveArchiveData();
            this.loadPageData();
            this.calculateTotals();
        }
    }

    // 清除所有数据
    clearAllData() {
        if (confirm('确定要清除所有档案数据吗？此操作不可恢复。')) {
            localStorage.removeItem('giftArchive');
            this.archiveData = {};
            this.initializeTable();
            this.calculateTotals();
            location.reload();
        }
    }
    
    // 重置档案 - 保留一页空白页面
    resetArchive() {
        if (confirm('确定要重置档案吗？此操作将清除所有数据并保留一个空白页面。')) {
            // 重置数据结构，仅保留一个空白页面
            this.archiveData = {
                records: {},
                meta: {
                    eventTitle: '',
                    eventLocation: '',
                    createDate: new Date().toLocaleDateString('zh-CN')
                }
            };
            
            // 为第一页创建空记录
            for (let i = 0; i < this.recordsPerPage; i++) {
                this.archiveData.records[i] = {
                    name: '',
                    address: '',
                    amount: '',
                    amountCapital: '',
                    gift: ''
                };
            }
            
            // 保存重置后的数据
            this.saveArchiveData();
            
            // 重新初始化表格
            this.initializeTable();
            
            // 更新总计
            this.calculateTotals();
            
            console.log('档案已重置，保留一页空白页面');
        }
    }
}

// 初始化应用
let giftArchive;
document.addEventListener('DOMContentLoaded', () => {
    giftArchive = new GiftArchive();
    
    // 立即更新传统日期
    giftArchive.updateTraditionalDate();
    
    // 每分钟更新一次时辰
    setInterval(() => {
        giftArchive.updateTraditionalDate();
    }, 60000);
});

// 全局函数
function addNewPage() {
    if (giftArchive) giftArchive.addNewPage();
}

function exportToWord() {
    if (giftArchive) giftArchive.exportToWord();
}

function printArchive() {
    if (giftArchive) giftArchive.printArchive();
}

function saveArchive() {
    if (giftArchive) giftArchive.saveArchive();
}

function clearArchive() {
    if (giftArchive) giftArchive.clearAllData();
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                giftArchive.saveArchive();
                break;
            case 'p':
                e.preventDefault();
                giftArchive.printArchive();
                break;
            case 'e':
                e.preventDefault();
                giftArchive.exportToWord();
                break;
        }
    }
});

// 页面卸载前保存数据
window.addEventListener('beforeunload', () => {
    giftArchive.saveArchive();
});

// 简化打印处理 - 移除可能干扰表格布局的JavaScript
// 使用纯CSS打印样式确保稳定的跨浏览器兼容性