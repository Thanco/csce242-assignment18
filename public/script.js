class Craft {
    constructor(_id, name, imageBase64, description, supplies) {
        this._id = _id;
        this.name = name;
        this.imageBase64 = imageBase64;
        this.description = description;
        this.supplies = supplies;
    }

    get image() {
        return `data:image/jpg;base64,${this.imageBase64}`;
    }

    get imageDisplay() {
        return `<img src="${this.image}" alt="${this.name}">`;
    }

    get supplyDisplay() {
        const supplyList = document.createElement('ul');
        this.supplies.forEach(supply => {
            const supplyItem = document.createElement('li');
            supplyItem.textContent = supply;
            supplyList.appendChild(supplyItem);
        });
        return supplyList;
    }

    get modalDisplay() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div id="modal-item-view" class="modal-content columns">
                <div class="one">${this.imageDisplay}</div>
                <div class="ten">
                    <span class="close">&times;</span>
                    <div class="modal-title">
                        <h2>${this.name}</h2>
                        <div class="modal-options">
                            <span class="btn-edit">✎</span>
                            <span class="btn-delete">🗑</span>
                        </div>
                    </div>
                    <p>${this.description}</p>
                    <h3>Supplies:</h3>
                    ${this.supplyDisplay.outerHTML}
                </div>
            </div>
        `;
        return content;
    }

    supplyListItem = (supply) => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="text" name="supplies" value="${supply}" minlength="4" required>`;

        const span = document.createElement('span');
        span.classList.add('btn-remove-item');
        span.textContent = '✖';
        span.addEventListener('click', () => {
            li.remove();
        });

        li.appendChild(span);
        return li;
    }

    createEditModal = () => {
        const content = document.createElement('div');
        content.innerHTML = `
            <div id="modal-item-view" class="modal-content columns">
                <div class="one"><img id="img-preview" src="${this.image}" alt="${this.name}"></div>
                <div class="ten">
                    <span class="btn-close">&times;</span>
                    <h2>Edit Craft</h2>
                    <form id="edit-craft-form" class="form-craft-info">
                        <input type="text" name="_id" id="_id" class="hidden" value="${this._id}">
                        <ul>
                            <li>
                                <label for="name">Name:</label>
                                <input type="text" name="name" value="${this.name}" minlength="4" required>
                            </li>
                            <li>
                                <label for="description">Description:</label>
                            </li>
                            <li>
                                <textarea name="description" name="description" rows="4" cols="50" minlength="10" required>${this.description}</textarea>
                            </li>
                            <li>
                                <label for="supplies">Supplies:</label>
                                <li><ul class="ul-supplies">
                                    ${this.supplies.map(supply =>
                                        this.supplyListItem(supply).outerHTML).join('')}
                                </ul></li>
                                <li><button type="button" class="btn-add-supply">Add Supply</button></li>
                            </li>
                            <li>
                                <label for="image">Image:</label>
                                <input type="file" name="image" class="input-image" accept="image/*">
                            </li>
                            <li>
                                <button class="btn-back">Back</button>
                                <button type="submit">Save</button>
                            </li>
                            <li><p class="error"></p></li>
                        </ul>
                    </form>
                </div>
            </div>
        `;
        return content;
    }

    modalEditDisplay = (modal) => {
        const content = this.createEditModal();

        const btnClose = content.querySelector('.btn-close');
        btnClose.addEventListener('click', () => {
            modal.remove();
        });

        const btnBack = content.querySelector('.btn-back');
        btnBack.textContent = 'Back';
        btnBack.addEventListener('click', () => {
            modal.remove();
            showItemDetails(this);
        });

        const btnAddSupply = content.querySelector('.btn-add-supply');
        btnAddSupply.addEventListener('click', () => {
            content.querySelector('.ul-supplies').appendChild(this.supplyListItem(''));
        });

        const removeItem = content.querySelectorAll('.btn-remove-item');
        removeItem.forEach(item => {
            item.addEventListener('click', () => {
                item.parentElement.remove();
            });
        });

        const imageInput = content.querySelector('.input-image');
        imageInput.addEventListener('change', (event) => {
            if (!event.target.files[0]) {
                return;
            }
            const image = event.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                content.querySelector('#img-preview').src = reader.result;
            }
            reader.readAsDataURL(image);
        });

        const editForm = content.querySelector('#edit-craft-form');
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const formInfo = new FormData(event.target);

            const error = editForm.querySelector('.error');
            if (formInfo.get('image').size > 1000000) {
                error.textContent = 'Image size is too large';
                return;
            }

            if (formInfo.getAll('supplies').length < 2) {
                error.textContent = 'Supply list is too short';
                return;
            }

            const put = fetch(`/api/crafts/${this._id}`, {
                method: 'PUT',
                body: formInfo,
            }).then(res => {
                if (!res.ok) {
                    console.error(res);
                    error.innerHTML = `Error updating craft: ${res.status}`;
                    console.log(`Error updating craft: ${res.status}`);
                    console.log(error.innerHTML);
                    return;
                }
    
                getCrafts();
                modal.remove();
            }).catch(e => {
                console.error(e);
                error.textContent = `Error updating craft: ${put.status}`;
                return;
            });
            
        });
        
        return content;
    }

    createDeleteModal = () => {
        const content = document.createElement('div');
        content.innerHTML = `
            <div id="modal-item-view" class="modal-content columns">
                <div class="one">${this.imageDisplay}</div>
                <div class="ten">
                    <span class="btn-close">&times;</span>
                    <h2>Delete Craft</h2>
                    <p>Are you sure you want to delete ${this.name}?</p>
                    <button class="btn-back">No</button>
                    <button class="btn-delete">Yes</button>
                    <p class="error"></p>
                </div>
            </div>
        `;
        return content;
    }

    modalDeleteDisplay = (modal) => {
        const content = this.createDeleteModal();

        const btnClose = content.querySelector('.btn-close');
        btnClose.addEventListener('click', () => {
            modal.remove();
        });

        const btnBack = content.querySelector('.btn-back');
        btnBack.textContent = 'No';
        btnBack.addEventListener('click', () => {
            modal.remove();
            showItemDetails(this);
        });

        const btnDelete = content.querySelector('.btn-delete');
        btnDelete.textContent = 'Yes';
        btnDelete.addEventListener('click', async () => {
            const del = await fetch(`/api/crafts/${this._id}`, {
                method: 'DELETE',
            }).catch(error => {
                error.textContent = `Error updating craft: ${put.status}`;
                return;
            });
                

            if (!del.ok) {
                content.querySelector('.error').textContent = `Error deleting craft: ${del.status}`;
                return;
            }

            getCrafts();
            modal.remove();
        });

        return content;
    }
}

const numColumns = 4;

const getQuarterOfArray = (array, input) => {
    const quarterSize = Math.floor(array.length / numColumns);
    const startIndex = input * quarterSize;
    const endIndex = startIndex + quarterSize;
    const quarter = array.slice(startIndex, endIndex);

    const remainder = array.length % numColumns;
    if (input < numColumns - 1 && remainder !== 0) {
        const remainderArray = array.slice(array.length - remainder);
        if (remainderArray.length > input) {
            quarter.push(remainderArray[input]);
        }
    }
    return quarter;
}

const buildColumns = (crafts) => {
    document.getElementById("crafts").innerHTML = '';
    for (let i = 0; i < numColumns; i++) {
        const section = document.createElement('section');
        section.classList.add('quarter');
        const quarterCrafts = getQuarterOfArray(crafts, i);
        buildColumn(quarterCrafts, section);
        document.getElementById("crafts").appendChild(section);
    }
}

const buildColumn = (quarterCrafts, section) => {
    quarterCrafts.forEach(craft => {
        const article = document.createElement('article');
        article.innerHTML = craft.imageDisplay;
        article.addEventListener('click', () => {
            showItemDetails(craft);
        });

        section.appendChild(article);
    });
}

getCrafts = () => {
    fetch('/api/crafts')
    .then(response => response.json())
    .then(data => {
        const crafts = [];
        data.forEach(craftJson => {
            const newCraft = new Craft(craftJson._id, craftJson.name, craftJson.image, craftJson.description, craftJson.supplies);
            crafts.push(newCraft);
        });
        buildColumns(crafts);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

const formModal = document.getElementById('craft-form');
formModal.style.visibility = 'hidden';
document.getElementById('btn-add-craft').addEventListener('click', () => {
    formModal.style.visibility = 'visible';
});

const closeForm = () => {
    formModal.style.visibility = 'hidden';
    document.getElementById('add-craft-form').reset();
    document.getElementById('ul-supplies').innerHTML = 
        `<li><input type="text" name="supplies" minlength="4" required></li>
        <li><input type="text" name="supplies" minlength="4" required></li>`
    ;
    document.getElementById('img-preview').src = 'https://place-hold.it/200x300';
    formModal.querySelector('.error').textContent = '';
}
document.getElementById('btn-close').addEventListener('click', () => {
    closeForm();
});

const imageInput = (event) => {
    if (!event.target.files[0]) {
        return;
    }
    const image = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('img-preview').src = reader.result;
    }
    reader.readAsDataURL(image);
}
document.getElementById('image').addEventListener('change', imageInput);

formModal.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formInfo = new FormData(event.target);

    const error = formModal.querySelector('.error');
    if (formInfo.get('image').size > 1000000) {
        error.textContent = 'Image size is too large';
        return;
    }

    if (formInfo.getAll('supplies').length < 2) {
        error.textContent = 'Supply list is too short';
        return;
    }

    const post = await fetch('/api/crafts', {
        method: 'POST',
        body: formInfo,
    }).catch(error => {
        error.textContent = `Error updating craft: ${put.status}`;
        return;
    });

    if (!post.ok) {
        error.textContent = `Error adding craft: ${post.status}`;
        return;
    }
    getCrafts();
    closeForm();
});

document.getElementById('btn-add-supply').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'supplies';
    input.required = true;
    input.minLength = 4;

    const li = document.createElement('li');
    li.appendChild(input);

    document.getElementById('ul-supplies').appendChild(li);
});

getCrafts();

const showItemDetails = (craft) => {
    const modal = craft.modalDisplay;
    modal.classList.add('modal');

    initItemViewOnClicks(modal, craft);

    document.body.appendChild(modal);
}

const initItemViewOnClicks = (modal, craft) => {
    const itemView = modal.querySelector('#modal-item-view');

    const close = modal.querySelector('.close');
    close.addEventListener('click', () => {
        modal.remove();
    });
    const btnEdit = modal.querySelector('.modal-options .btn-edit');
    btnEdit.addEventListener('click', () => {
        itemView.replaceWith(craft.modalEditDisplay(modal));
    });
    const btnDelete = modal.querySelector('.modal-options .btn-delete');
    btnDelete.addEventListener('click', () => {
        itemView.replaceWith(craft.modalDeleteDisplay(modal));
    });
}
