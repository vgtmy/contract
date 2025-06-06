// 模板管理功能
class TemplateManager {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.loadTemplates();
    }

    initElements() {
        this.templateList = document.getElementById('templateList');
        this.createBtn = document.getElementById('createTemplate');
        this.templateForm = document.getElementById('templateForm');
        this.templateModal = document.getElementById('templateModal');
        this.searchInput = document.querySelector('.search-input');
    }

    bindEvents() {
        this.createBtn.addEventListener('click', () => this.showCreateForm());
        this.templateForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.searchInput.addEventListener('input', (e) => this.searchTemplates(e.target.value));
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            this.renderTemplates(templates);
        } catch (error) {
            console.error('加载模板失败:', error);
            alert('加载模板失败，请稍后重试');
        }
    }

    renderTemplates(templates) {
        this.templateList.innerHTML = templates.map(template => `
            <tr>
                <td>${template.name}</td>
                <td>${template.category}</td>
                <td>${new Date(template.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-info edit-btn" data-id="${template.id}">编辑</button>
                    <button class="btn btn-danger delete-btn" data-id="${template.id}">删除</button>
                </td>
            </tr>
        `).join('');

        // 绑定编辑和删除按钮事件
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.editTemplate(e.target.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteTemplate(e.target.dataset.id));
        });
    }

    showCreateForm() {
        this.templateForm.reset();
        this.templateModal.style.display = 'block';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('templateName').value,
            category: document.getElementById('templateCategory').value,
            content: document.getElementById('templateContent').value
        };

        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.templateModal.style.display = 'none';
                this.loadTemplates();
                alert('模板保存成功');
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存模板失败:', error);
            alert('保存模板失败，请稍后重试');
        }
    }

    async editTemplate(id) {
        try {
            const response = await fetch(`/api/templates/${id}`);
            const template = await response.json();
            
            document.getElementById('templateName').value = template.name;
            document.getElementById('templateCategory').value = template.category;
            document.getElementById('templateContent').value = template.content;
            
            this.templateModal.style.display = 'block';
        } catch (error) {
            console.error('获取模板详情失败:', error);
            alert('获取模板详情失败');
        }
    }

    async deleteTemplate(id) {
        if (!confirm('确定要删除这个模板吗？')) return;
        
        try {
            const response = await fetch(`/api/templates/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadTemplates();
                alert('模板删除成功');
            } else {
                throw new Error('删除失败');
            }
        } catch (error) {
            console.error('删除模板失败:', error);
            alert('删除模板失败');
        }
    }

    searchTemplates(keyword) {
        // 实现搜索功能
        console.log('搜索关键词:', keyword);
        // 实际项目中这里应该调用API进行搜索
    }
}

// 初始化模板管理
document.addEventListener('DOMContentLoaded', () => {
    new TemplateManager();
});
