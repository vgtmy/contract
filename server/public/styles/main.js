<script src="/scripts/main.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const contractList = document.querySelector('#contract-list ul');

    // 从后端 API 获取合同数据
    fetch('/api/contracts')
        .then(response => response.json())
        .then(data => {
            // 动态生成合同列表
            data.forEach(contract => {
                const li = document.createElement('li');
                li.textContent = `${contract.title} - ${contract.description} (${contract.status})`;
                contractList.appendChild(li);
            });
        })
        .catch(error => console.error('加载合同数据失败:', error));

    document.querySelector('#contract-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const newContract = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
        };

        // 向后端发送 POST 请求
        fetch('/api/contracts', { method: 'POST', ... })
            .then(response => response.json())
            .then(data => {
                alert('合同创建成功！');
                location.reload(); // 刷新页面以显示新合同
            })
            .catch(error => console.error('创建合同失败:', error));
    });
});
