/**
 * Fetches contracts from the server with optional query parameters and renders them into the main list.
 * Handles potential network errors and errors from the server response.
 * @param {object} [queryParams={}] - Optional parameters for filtering and searching contracts.
 * @param {string} [queryParams.search] - Search term for contract title or description.
 * @param {string} [queryParams.status] - Status to filter contracts by.
 * @param {string} [queryParams.type] - Type to filter contracts by (currently not fully implemented in backend).
 */
async function loadContracts(queryParams = {}) {
  console.log("Loading contracts with params:", queryParams);

  const params = new URLSearchParams();
  if (queryParams.search) {
    params.append('search', queryParams.search);
  }
  if (queryParams.status) {
    params.append('status', queryParams.status);
  }
  // if (queryParams.type) { // Example: Uncomment if type filter is fully implemented in backend
  //   params.append('type', queryParams.type);
  // }

  const queryString = params.toString();
  const url = `/api/contracts${queryString ? '?' + queryString : ''}`;
  console.log("Fetching from URL:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) { /* Ignore if error response is not JSON */ }
      throw new Error(errorMsg);
    }
    const contracts = await response.json();
    console.log("Contracts loaded:", contracts);
    renderContracts(contracts);
  } catch (error) {
    console.error("Error loading contracts:", error);
    const contractListULElement = document.querySelector('#contract-list ul');
    if (contractListULElement) {
        contractListULElement.innerHTML = `<li>加载合同失败: ${error.message}. 请稍后重试或联系管理员。</li>`;
    }
  }
}

/**
 * Renders a list of contracts into the main contract list UI (#contract-list ul).
 * Each contract item includes details, status, and action buttons (View, Edit, Track).
 * @param {Array<object>} contracts - An array of contract objects to render.
 */
function renderContracts(contracts) {
  const contractListULElement = document.querySelector('#contract-list ul');

  if (!contractListULElement) {
    console.error('#contract-list ul element not found.');
    return;
  }

  contractListULElement.innerHTML = ''; // Clear existing contracts

  if (!contracts || contracts.length === 0) {
    contractListULElement.innerHTML = '<li>暂无合同数据显示。</li>';
    console.log('No contracts to render.');
    return;
  }

  contracts.forEach(contract => {
    const listItem = document.createElement('li');
    listItem.style.listStyleType = 'none';

    const contractItemDiv = document.createElement('div');
    contractItemDiv.className = 'contract-item';
    contractItemDiv.style.borderLeft = '5px solid #667eea';

    // Contract Header
    const contractHeaderDiv = document.createElement('div');
    contractHeaderDiv.className = 'contract-header';

    const headerDetailsDiv = document.createElement('div');
    const titleH3 = document.createElement('h3');
    titleH3.className = 'contract-title';
    titleH3.textContent = contract.title || 'N/A';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'contract-meta';
    const contractId = contract.id || 'N/A';
    const clientOrType = contract.description || 'N/A';
    const amount = contract.amount || '金额待定';
    const creationDate = contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : '日期未知';
    metaDiv.textContent = `合同编号：${contractId} | 客户/类型：${clientOrType} | 金额：¥${amount} | 创建：${creationDate}`;

    headerDetailsDiv.appendChild(titleH3);
    headerDetailsDiv.appendChild(metaDiv);

    // Contract Actions
    const contractActionsDiv = document.createElement('div');
    contractActionsDiv.className = 'contract-actions';

    const statusBadgeSpan = document.createElement('span');
    statusBadgeSpan.className = 'status-badge';
    // Status styling (can be expanded with more specific classes if needed)
    if (contract.status === 'pending') {
      statusBadgeSpan.classList.add('status-pending');
      statusBadgeSpan.textContent = '待审批';
    } else if (contract.status === 'approved') {
      statusBadgeSpan.classList.add('status-approved');
      statusBadgeSpan.textContent = '已审批';
    } else if (contract.status === 'executed') {
      statusBadgeSpan.classList.add('status-executed');
      statusBadgeSpan.textContent = '执行中';
    } else if (contract.status === 'completed') {
      statusBadgeSpan.classList.add('status-completed');
      statusBadgeSpan.textContent = '已完成';
    } else {
      statusBadgeSpan.textContent = contract.status || '未知状态';
    }

    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-info view-contract-btn';
    viewButton.textContent = '查看';
    viewButton.setAttribute('data-id', contract.id);

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-primary edit-contract-btn';
    editButton.textContent = '编辑';
    editButton.setAttribute('data-id', contract.id);

    const trackButton = document.createElement('button');
    trackButton.className = 'btn btn-warning track-contract-btn';
    trackButton.textContent = '跟踪';
    trackButton.setAttribute('data-id', contract.id);

    contractActionsDiv.appendChild(statusBadgeSpan);
    contractActionsDiv.appendChild(viewButton);
    contractActionsDiv.appendChild(editButton);
    contractActionsDiv.appendChild(trackButton);

    contractHeaderDiv.appendChild(headerDetailsDiv);
    contractHeaderDiv.appendChild(contractActionsDiv);

    // Progress Bar
    const progressBarDiv = document.createElement('div');
    progressBarDiv.className = 'progress-bar';
    const progressFillDiv = document.createElement('div');
    progressFillDiv.className = 'progress-fill';
    const progressPercent = contract.progress || 50; // Default progress if not specified
    progressFillDiv.style.width = `${progressPercent}%`;
    progressBarDiv.appendChild(progressFillDiv);

    // Progress Details
    const progressDetailsDiv = document.createElement('div');
    progressDetailsDiv.style.fontSize = '0.9rem';
    progressDetailsDiv.style.color = '#666';
    progressDetailsDiv.textContent = `进度：${progressPercent}% | 签署时间：日期未知 | 预计完成：日期未知`;

    contractItemDiv.appendChild(contractHeaderDiv);
    contractItemDiv.appendChild(progressBarDiv);
    contractItemDiv.appendChild(progressDetailsDiv);

    listItem.appendChild(contractItemDiv);
    contractListULElement.appendChild(listItem);
  });
  console.log(`${contracts.length} contracts rendered.`);
}

/**
 * Resets the new/edit contract modal (#newContractModal) to its default "create" state.
 * Clears all form fields, the hidden contract ID input, resets the modal title,
 * and the submit button text. Also re-enables any potentially disabled form fields.
 */
function resetNewContractModal() {
    const form = document.getElementById('newContractForm');
    if (form) {
        form.reset();
    }
    const contractIdInput = document.getElementById('contractIdInput');
    if (contractIdInput) {
        contractIdInput.value = '';
    }

    const modalTitle = document.querySelector('#newContractModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = '📄 创建新合同';
    }
    const submitButton = document.querySelector('#newContractModal button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = '创建合同';
        submitButton.style.display = 'inline-block'; // Ensure it's visible
    }

    const fieldsToEnable = ['contractNameInput', 'contractTypeInput', 'contractClientNameInput', 'contractAmountInput', 'contractStartDateInput', 'contractEndDateInput', 'contractProjectLeadInput'];
    fieldsToEnable.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.disabled = false;
    });
}

/**
 * Fetches a single contract's details by its ID and displays them in a modal for viewing.
 * The form fields in the modal are populated and then disabled to indicate a read-only state.
 * @param {string} contractId - The ID of the contract to view.
 */
async function handleViewContract(contractId) {
    console.log('View contract:', contractId);
    resetNewContractModal(); // Reset form to clear previous state and enable fields

    try {
        const response = await fetch(`/api/contracts/${contractId}`);
        if (!response.ok) {
            let errorMsg = `查看合同失败: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) { /* Ignore if response is not JSON */ }
            throw new Error(errorMsg);
        }
        const contract = await response.json();

        document.getElementById('contractNameInput').value = contract.title || '';

        const descriptionParts = (contract.description || '').split(', 类型: ');
        const clientName = descriptionParts[0] ? descriptionParts[0].replace('客户: ', '') : '';
        const contractType = descriptionParts[1] || '';
        document.getElementById('contractClientNameInput').value = clientName;
        document.getElementById('contractTypeInput').value = contractType;

        document.getElementById('contractAmountInput').value = contract.amount || '';
        document.getElementById('contractStartDateInput').value = contract.startDate || '';
        document.getElementById('contractEndDateInput').value = contract.endDate || '';
        document.getElementById('contractProjectLeadInput').value = contract.projectLead || '';

        const contractIdInput = document.getElementById('contractIdInput');
        if (contractIdInput) contractIdInput.value = contract.id;

        const modalTitle = document.querySelector('#newContractModal .modal-title');
        if (modalTitle) modalTitle.textContent = '查看合同';

        const submitButton = document.querySelector('#newContractModal button[type="submit"]');
        if (submitButton) submitButton.style.display = 'none';

        const fieldsToDisable = ['contractNameInput', 'contractTypeInput', 'contractClientNameInput', 'contractAmountInput', 'contractStartDateInput', 'contractEndDateInput', 'contractProjectLeadInput'];
        fieldsToDisable.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.disabled = true;
        });

        openModal('newContractModal');
    } catch (error) {
        console.error('Error fetching contract for view:', error);
        alert(error.message);
    }
}

/**
 * Fetches a single contract's details and populates the new/edit modal form for editing.
 * @param {string} contractId - The ID of the contract to edit.
 */
async function handleEditContract(contractId) {
    console.log('Edit contract:', contractId);
    resetNewContractModal(); // Reset form and enable fields before populating

    try {
        const response = await fetch(`/api/contracts/${contractId}`);
        if (!response.ok) {
            let errorMsg = `编辑合同失败: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) { /* Ignore */ }
            throw new Error(errorMsg);
        }
        const contract = await response.json();

        document.getElementById('contractNameInput').value = contract.title || '';
        const descriptionParts = (contract.description || '').split(', 类型: ');
        const clientName = descriptionParts[0] ? descriptionParts[0].replace('客户: ', '') : '';
        const contractType = descriptionParts[1] || '';
        document.getElementById('contractClientNameInput').value = clientName;
        document.getElementById('contractTypeInput').value = contractType;
        document.getElementById('contractAmountInput').value = contract.amount || '';
        document.getElementById('contractStartDateInput').value = contract.startDate || '';
        document.getElementById('contractEndDateInput').value = contract.endDate || '';
        document.getElementById('contractProjectLeadInput').value = contract.projectLead || '';

        const contractIdInput = document.getElementById('contractIdInput');
        if (contractIdInput) contractIdInput.value = contract.id;

        const modalTitle = document.querySelector('#newContractModal .modal-title');
        if (modalTitle) modalTitle.textContent = '编辑合同';

        const submitButton = document.querySelector('#newContractModal button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = '保存更改';
            submitButton.style.display = 'inline-block';
        }

        openModal('newContractModal');
    } catch (error) {
        console.error('Error fetching contract for edit:', error);
        alert(error.message);
    }
}

/**
 * Handles the submission of the contract form for both creating new contracts (POST)
 * and updating existing ones (PUT). It reads values from the form, constructs the
 * data object, and makes the appropriate API call.
 * @param {Event} event - The form submission event.
 */
async function handleCreateContractSubmit(event) {
  event.preventDefault();

  const contractIdInput = document.getElementById('contractIdInput');
  const contractId = contractIdInput ? contractIdInput.value : '';
  const isEditMode = !!contractId;

  const title = document.getElementById('contractNameInput')?.value;
  const clientName = document.getElementById('contractClientNameInput')?.value || 'N/A';
  const contractType = document.getElementById('contractTypeInput')?.value || 'N/A';
  // const amount = document.getElementById('contractAmountInput')?.value; // Example for future use

  const description = `客户: ${clientName}, 类型: ${contractType}`;
  // For status, default to 'pending' for new contracts.
  // If a status field (e.g., <select id="contractStatusInput">) is added to the form later for editing, its value would be used.
  const status = 'pending'; // Default for new. For edit, status is part of contractData if changed.

  if (!title) {
    alert('合同名称是必填项！');
    return;
  }

  const contractData = { title, description, status };
  console.log(isEditMode ? "Updating contract:" : "Submitting new contract:", contractData);

  const url = isEditMode ? `/api/contracts/${contractId}` : '/api/contracts';
  const method = isEditMode ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      let errorMsg = `${isEditMode ? '更新' : '创建'}合同失败: ${response.status}`;
      try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) { /* Ignore if response is not JSON */ }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    console.log(isEditMode ? "Contract updated:" : "Contract created:", result);

    closeModal('newContractModal');
    resetNewContractModal();
    loadContracts();
    alert(isEditMode ? '合同更新成功！' : '合同创建成功！');

  } catch (error) {
    console.error(isEditMode ? "Error updating contract:" : "Error creating contract:", error);
    alert(error.message);
  }
}

/**
 * Main DOMContentLoaded event listener.
 * Initializes contract loading, sets up form submissions, event delegation for contract actions,
 * modal reset behaviors, filter/search functionality, and dashboard data loading.
 */
document.addEventListener('DOMContentLoaded', () => {
  loadContracts(); // Initial load of all contracts

  const newContractForm = document.getElementById('newContractForm');
  if (newContractForm) {
    newContractForm.addEventListener('submit', handleCreateContractSubmit);
  } else {
    console.warn('#newContractForm not found.');
  }

  // Event delegation for contract item actions (View, Edit, Track)
  const contractListULElement = document.querySelector('#contract-list ul');
  if (contractListULElement) {
    contractListULElement.addEventListener('click', (event) => {
      const target = event.target;
      const contractId = target.getAttribute('data-id');

      if (target.classList.contains('view-contract-btn') && contractId) {
        handleViewContract(contractId);
      } else if (target.classList.contains('edit-contract-btn') && contractId) {
        handleEditContract(contractId);
      } else if (target.classList.contains('track-contract-btn')) {
        alert('此功能尚未实现 (This feature is not yet implemented)');
      }
    });
  } else {
    console.warn('#contract-list ul not found for event delegation.');
  }

  // Add event listener to the main modal's close button (X) to reset form state.
  const modalCloseButton = document.querySelector('#newContractModal .close');
  if (modalCloseButton) {
      modalCloseButton.addEventListener('click', resetNewContractModal);
  }
  // Note: The global window.onclick for closing modals by clicking outside already calls resetNewContractModal
  // if the closed modal is '#newContractModal'.

  // Setup event listeners for search and filters
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const typeFilter = document.getElementById('typeFilter');

  function handleFilterChange() {
    const queryParams = {
      search: searchInput ? searchInput.value : '',
      status: statusFilter ? statusFilter.value : '',
      type: typeFilter ? typeFilter.value : '',
    };
    Object.keys(queryParams).forEach(key => {
      if (!queryParams[key] || queryParams[key] === '全部状态' || queryParams[key] === '全部类型') {
        delete queryParams[key];
      }
    });
    loadContracts(queryParams);
  }

  if (searchInput) {
    searchInput.addEventListener('input', handleFilterChange);
  } else {
    console.warn('#searchInput not found.');
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', handleFilterChange);
  } else {
    console.warn('#statusFilter not found.');
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', handleFilterChange);
  } else {
    console.warn('#typeFilter not found.');
  }

  loadDashboardData(); // Load dashboard data on initial page load
});

/**
 * Fetches and displays dashboard statistics (contract counts) and a list of recent contracts.
 * Handles potential network errors and errors from server responses for both stats and recent contracts.
 */
async function loadDashboardData() {
    console.log("Loading dashboard data...");
    try {
        // Fetch contract statistics
        const statsResponse = await fetch('/api/contracts/stats');
        if (!statsResponse.ok) {
            let errorMsg = `Failed to load dashboard stats: ${statsResponse.status}`;
            try {
                const errorData = await statsResponse.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) { /* Ignore */ }
            throw new Error(errorMsg);
        }
        const stats = await statsResponse.json();

        const pendingApprovalEl = document.getElementById('pendingApprovalCount');
        if (pendingApprovalEl) pendingApprovalEl.textContent = stats.pendingApproval || 0;

        const ongoingContractsEl = document.getElementById('ongoingContractsCount');
        if (ongoingContractsEl) ongoingContractsEl.textContent = stats.ongoing || 0;

        const expiringSoonEl = document.getElementById('expiringSoonCount');
        if (expiringSoonEl) expiringSoonEl.textContent = stats.expiringSoon || 0;

        const addedThisMonthEl = document.getElementById('addedThisMonthCount');
        if (addedThisMonthEl) addedThisMonthEl.textContent = stats.addedThisMonth || 0;

        // Fetch recent contracts (e.g., limit 3)
        const recentContractsResponse = await fetch('/api/contracts?limit=3');
        if (!recentContractsResponse.ok) {
            let errorMsg = `Failed to load recent contracts: ${recentContractsResponse.status}`;
            try {
                const errorData = await recentContractsResponse.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) { /* Ignore */ }
            throw new Error(errorMsg);
        }
        const recentContracts = await recentContractsResponse.json();

        renderRecentContracts(recentContracts);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Optionally update UI to show an error loading dashboard stats/recent contracts
        const dashboardErrorDisplay = document.getElementById('dashboardErrorDisplay');
        if (dashboardErrorDisplay) { // Assuming an element with id="dashboardErrorDisplay" exists for this purpose
            dashboardErrorDisplay.textContent = `无法加载仪表盘数据: ${error.message}`;
        } else {
            console.warn("No specific dashboard error display element found. Dashboard errors will only be in console.");
        }
    }
}

/**
 * Renders a list of recent contracts into the dashboard's recent contracts section.
 * @param {Array<object>} contracts - An array of contract objects.
 */
function renderRecentContracts(contracts) {
    const recentContractsListDiv = document.getElementById('recentContractsList');
    if (!recentContractsListDiv) {
        console.error('#recentContractsList element not found.');
        return;
    }
    recentContractsListDiv.innerHTML = ''; // Clear existing static or old items

    if (!contracts || contracts.length === 0) {
        recentContractsListDiv.innerHTML = '<p>暂无最近合同记录。</p>';
        return;
    }

    contracts.forEach(contract => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'contract-item'; // Reuse existing styling if appropriate

        const titleH3 = document.createElement('h3');
        titleH3.className = 'contract-title';
        titleH3.textContent = contract.title || 'N/A';

        const metaDiv = document.createElement('div');
        metaDiv.className = 'contract-meta';
        metaDiv.textContent = `状态: ${contract.status || 'N/A'} | ID: ${contract.id || 'N/A'}`;
        // Add more details if needed, similar to renderContracts but perhaps simpler

        itemDiv.appendChild(titleH3);
        itemDiv.appendChild(metaDiv);
        // Add View/Edit buttons if desired for recent contracts as well
        // For now, keeping it simple for the dashboard view.

        recentContractsListDiv.appendChild(itemDiv);
    });
}
