--- START OF FILE product-detail.js ---

// Table of contents
/**** List scroll you'll love this to ****/
/**** detail infor by fetch data ****/
/*****----- Next, Prev products when click button -----************/
/*****----- list-img -----************/
/*****----- list-img countdown timer -----************/
/*****----- list-img variable -----************/
/*****----- list-img on-sale -----************/
/*****----- list-img fixed-price -----************/
/*****----- product sale -----************/
/*****----- infor -----************/
/*****----- Handle Color and Size Selection -----************/
/*****----- Handle Quantity Change -----************/
/*****----- Add to Cart Functionality -----************/
/*****----- Buy It Now Functionality -----************/
/**** detail ****/
/**** desc-tab ****/
/**** list-img on-sale ****/
/**** list-img review ****/
/**** Redirect filter type product-sidebar ****/



// List scroll you'll love this to
if (document.querySelector('.swiper-product-scroll')) {
    var swiperCollection = new Swiper(".swiper-product-scroll", {
        scrollbar: {
            el: ".swiper-scrollbar",
            hide: true,
        },
        loop: false,
        slidesPerView: 2,
        spaceBetween: 16,
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1280: {
                slidesPerView: 3,
                spaceBetween: 20,
            },
        },
    });
}


// detail infor by fetch data
const pathname = new URL(window.location.href)
const productId = pathname.searchParams.get('id') === null ? '1' : pathname.searchParams.get('id')
const productDetail = document.querySelector('.product-detail')
let currentIndex;
let currentProduct = null; // Store the current product details

// Href
let classes = productDetail.className.split(' ');
let typePage = classes[1];


function mapApiProductToFrontend(product) {
  return {
    id: String(product.id),
    category: product.category,
    type: product.type,
    name: product.name,
    new: !!product.is_new,
    sale: !!product.on_sale,
    rate: Number(product.rate),
    price: Number(product.price),
    originPrice: Number(product.origin_price),
    brand: product.brand,
    sold: product.sold,
    quantity: product.quantity,
    quantityPurchase: product.quantityPurchase || 1, // default to 1
    sizes: Array.isArray(product.sizes)
      ? product.sizes
      : product.sizes
      ? JSON.parse(product.sizes)
      : [],
    variation: Array.isArray(product.variation)
      ? product.variation
      : product.variations
      ? JSON.parse(product.variations)
      : [],
    thumbImage: Array.isArray(product.thumbImage)
      ? product.thumbImage
      : product.thumb_image
      ? [product.thumb_image]
      : [],
    images: Array.isArray(product.images)
      ? product.images
      : product.gallery
      ? JSON.parse(product.gallery)
      : [],
    description: product.description,
    action: product.action,
    slug: product.slug,
    gender: product.gender, // Assuming gender is part of the product data
  };
}


if (productDetail) {
    fetch('/api/admin/products')
        .then(response => response.json())
        .then(data => {
            const mappedProducts = data.map(mapApiProductToFrontend);
            currentProduct = mappedProducts.find(product => product.id === productId);

            // If product is not found, redirect or show error
            if (!currentProduct) {
                console.error('Product not found with ID:', productId);
                // Optionally redirect to a 404 page or shop page
                // window.location.href = 'shop.html';
                return;
            }

            // find location of current product in array
            currentIndex = mappedProducts.findIndex(product => product.id === productId);

            // Next, Prev products when click button
            const prevBtn = document.querySelector('.breadcrumb-product .prev-btn')
            const nextBtn = document.querySelector('.breadcrumb-product .next-btn')

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentIndex = (currentIndex + 1) % mappedProducts.length;
                    const nextProduct = mappedProducts[currentIndex];
                    window.location.href = `product-${typePage}.html?id=${nextProduct.id}`
                })
            }


            if (prevBtn) {
                if (productId === '1' || currentIndex === 0) { // Check for both ID '1' and first element in array
                    prevBtn.remove()
                } else {
                    prevBtn.addEventListener('click', () => {
                        currentIndex = (currentIndex - 1 + mappedProducts.length) % mappedProducts.length; // Ensure index doesn't go negative
                        const nextProduct = mappedProducts[currentIndex];
                        window.location.href = `product-${typePage}.html?id=${nextProduct.id}`
                    })
                }
            }


            // list-img
            const listImg2 = productDetail.querySelector('.featured-product .list-img .mySwiper2 .swiper-wrapper')
            const listImg = productDetail.querySelector('.featured-product .list-img .mySwiper .swiper-wrapper')
            const listImgMain = productDetail.querySelector('.featured-product .list-img .popup-img .swiper-wrapper')
            const popupImg = productDetail.querySelector('.featured-product .list-img .popup-img')

            if (listImg2 && listImg && currentProduct.images) {
                currentProduct.images.map(item => {
                    const imgItem = document.createElement('div')
                    imgItem.classList.add('swiper-slide', 'popup-link')
                    imgItem.innerHTML = `
                        <img src=${item} alt='img' class='w-full aspect-[3/4] object-cover' />
                    `
                    const imgItemClone = imgItem.cloneNode(true) // Copy imgItem
                    const imgItemClone2 = imgItem.cloneNode(true) // Copy imgItem
                    imgItemClone.classList.remove('popup-link')

                    listImg2.appendChild(imgItem)
                    listImg.appendChild(imgItemClone)
                    listImgMain.appendChild(imgItemClone2)

                    const slides = document.querySelectorAll('.mySwiper .swiper-slide')
                    if (slides.length > 0) {
                        slides[0].classList.add('swiper-slide-thumb-active')
                    }

                    slides.forEach((img, index) => {
                        img.addEventListener('click', () => {
                            // Chuyển swiper 2 đến vị trí tương ứng với ảnh được click trong swiper 1
                            if (typeof swiper2 !== 'undefined') { // Check if swiper2 is initialized
                                swiper2.slideTo(index);
                            }
                        });
                    });
                })
            }

            // list-img countdown timer
            const listImg3 = productDetail.querySelector('.featured-product.countdown-timer .list-img .list')
            if (listImg3 && currentProduct.images) {
                currentProduct.images.map(item => {
                    const imgItem = document.createElement('div')
                    imgItem.classList.add('popup-link', 'swiper-slide')
                    imgItem.innerHTML = `
                        <img src=${item} alt='img' class='w-full aspect-[3/4] object-cover rounded-[20px]' />
                    `
                    const imgItemClone2 = imgItem.cloneNode(true)

                    listImg3.appendChild(imgItem)
                    listImgMain.appendChild(imgItemClone2)
                })
            }

            // list-img variable
            const listImg4 = productDetail.querySelector('.featured-product.variable .list-img .list')

            if (listImg4 && currentProduct.images) {
                currentProduct.images.forEach((item, index) => {
                    const imgItem = document.createElement('div');
                    imgItem.classList.add('popup-link', 'swiper-slide')
                    imgItem.innerHTML = `
                        <img src=${item} alt='img' class='w-full aspect-[3/4] object-cover rounded-[20px]' />
                    `;

                    const imgItemClone2 = imgItem.cloneNode(true)

                    // Add img 1st and 4th,... to listImg4
                    if (index === 0 || index === 3) {
                        imgItem.classList.add('col-span-2')
                    }

                    listImg4.appendChild(imgItem);
                    listImgMain.appendChild(imgItemClone2)
                })
            }

            // list-img on-sale
            const listImg5 = productDetail.querySelector('.featured-product.on-sale .list-img .swiper .swiper-wrapper')

            if (listImg5 && currentProduct.images) {
                currentProduct.images.map(item => {
                    const imgItem = document.createElement('div')
                    imgItem.classList.add('swiper-slide', 'popup-link')
                    imgItem.innerHTML = `
                        <img src=${item} alt='img' class='w-full aspect-[3/4] object-cover' />
                    `
                    const imgItemClone2 = imgItem.cloneNode(true)

                    listImg5.appendChild(imgItem)
                    listImgMain.appendChild(imgItemClone2)
                })
            }

            // list-img fixed-price
            const listImg6 = productDetail.querySelector('.featured-product.fixed-price .list-img .list')

            if (listImg6 && currentProduct.images) {
                currentProduct.images.forEach((item, index) => {
                    const imgItem = document.createElement('div');
                    imgItem.classList.add('popup-link', 'swiper-slide')
                    imgItem.innerHTML = `
                        <img src=${item} alt='img' class='w-full h-full object-cover' />
                    `;

                    // Add img 1st and 2nd,... to listImg6
                    if (index === 0 || index === 1) {
                        imgItem.classList.add('md:row-span-2', 'row-span-1', 'col-span-1', 'max-md:aspect-[3/4]', 'lg:rounded-[20px]', 'rounded-xl', 'overflow-hidden')
                    }

                    // Add img 3rd and 4th,... to listImg6
                    if (currentProduct.images.length < 4) {
                        // console.log(false); // Removed for production
                        if (index === 2) {
                            imgItem.classList.add('md:row-span-2', 'row-span-1', 'col-span-1', 'max-md:aspect-[3/4]', 'lg:rounded-[20px]', 'rounded-xl', 'overflow-hidden')
                        }
                    } else {
                        // console.log(true); // Removed for production
                        if (index === 2 || index === 3) {
                            imgItem.classList.add('row-span-1', 'md:col-span-1', 'col-span-2', 'aspect-[5/3]', 'lg:rounded-[20px]', 'rounded-xl', 'overflow-hidden')
                        }
                    }
                    const imgItemClone2 = imgItem.cloneNode(true)

                    listImg6.appendChild(imgItem);
                    listImgMain.appendChild(imgItemClone2)
                })
            }


            // product sale
            const productSale = productDetail.querySelector('.sold-block')
            if (productSale && currentProduct.sold !== undefined && currentProduct.quantity !== undefined) {
                const percentSold = productSale.querySelector('.percent-sold')
                const percentSoldNumber = productSale.querySelector('.percent-sold-number')
                const remainingNumber = productSale.querySelector('.remaining-number')

                if (currentProduct.quantity > 0) {
                    percentSold.style.width = Math.floor((currentProduct.sold / currentProduct.quantity) * 100) + '%'
                    percentSoldNumber.innerHTML = Math.floor((currentProduct.sold / currentProduct.quantity) * 100) + '% Sold -'
                    remainingNumber.innerHTML = currentProduct.quantity - currentProduct.sold
                } else {
                    percentSold.style.width = '0%';
                    percentSoldNumber.innerHTML = '0% Sold -';
                    remainingNumber.innerHTML = 'N/A';
                }
            }

            // show, hide popup img
            const imgItems = productDetail.querySelectorAll('.list-img .popup-link>img')
            const closePopupBtn = productDetail.querySelector('.list-img .popup-img .close-popup-btn')

            imgItems.forEach((item, index) => {
                item.addEventListener("click", () => {
                    // console.log(index); // Removed for production
                    popupImg.classList.add('open')

                    // list-img popup
                    var listPopupImg = new Swiper(".popup-img", {
                        loop: true,
                        clickable: true,
                        slidesPerView: 1,
                        spaceBetween: 0,
                        navigation: {
                            nextEl: ".swiper-button-next",
                            prevEl: ".swiper-button-prev",
                        },
                        initialSlide: index,
                    });
                })
            })

            closePopupBtn.addEventListener('click', () => {
                popupImg.classList.remove('open')
            })

            // infor - Display product details in the main info section
            displayProductInfo(currentProduct);

            // Handle Color and Size Selection
            handleColorAndSizeSelection(currentProduct);

            // Handle Quantity Change
            handleQuantityChange(currentProduct);

            // Add to Cart Functionality
            setupAddToCart(currentProduct);

            // Buy It Now Functionality
            setupBuyItNow(currentProduct);
        })
        .catch(error => console.error('Error fetching products:', error));
}


// Function to display product information
function displayProductInfo(product) {
    if (!productDetail || !product) return;

    productDetail.querySelector('.product-infor').setAttribute('data-item', product.id);
    productDetail.querySelector('.product-category').innerHTML = product.category || 'N/A';
    productDetail.querySelector('.product-name').innerHTML = product.name || 'N/A';
    productDetail.querySelector('.product-description').innerHTML = product.description || 'No description available.';

    const productPriceElement = productDetail.querySelector('.product-price');
    const productOriginPriceElement = productDetail.querySelector('.product-origin-price');
    const productSaleElement = productDetail.querySelector('.product-sale');

    if (product.price !== undefined) {
        productPriceElement.innerHTML = '₹' + product.price.toFixed(2);
    } else {
        productPriceElement.innerHTML = '₹0.00';
    }

    if (product.originPrice !== undefined && product.originPrice > product.price) {
        productOriginPriceElement.innerHTML = '<del>₹' + product.originPrice.toFixed(2) + '</del>';
        const discountPercentage = Math.floor(100 - ((product.price / product.originPrice) * 100));
        productSaleElement.innerHTML = '-' + discountPercentage + '%';
        productSaleElement.style.display = 'inline-block'; // Show sale tag
    } else {
        productOriginPriceElement.innerHTML = '';
        productSaleElement.innerHTML = '';
        productSaleElement.style.display = 'none'; // Hide sale tag if no sale
    }


    // Clear existing colors and sizes
    const listColor = productDetail.querySelector('.choose-color .list-color');
    const listSize = productDetail.querySelector('.choose-size .list-size');
    if (listColor) listColor.innerHTML = '';
    if (listSize) listSize.innerHTML = '';

    // Add colors if available
    if (product.variation && product.variation.length > 0) {
        product.variation.forEach((item, index) => {
            const colorItem = document.createElement('div');
            colorItem.classList.add('color-item', 'w-12', 'h-12', 'rounded-xl', 'duration-300', 'relative', 'cursor-pointer');
            if (index === 0) colorItem.classList.add('active'); // Set first color as active by default
            colorItem.setAttribute('data-color', item.color);
            colorItem.innerHTML = `
                <img src='${item.colorImage || './assets/images/product/color/default.png'}' alt='color' class='rounded-xl' />
                <div class="tag-action bg-black text-white caption2 capitalize px-1.5 py-0.5 rounded-sm">
                    ${item.color}
                </div>
            `;
            listColor && listColor.appendChild(colorItem);
        });
        // Update displayed color name
        const initialColor = product.variation[0] ? product.variation[0].color : '';
        productDetail.querySelector('.choose-color .text-title .color').innerHTML = initialColor;
    } else {
         productDetail.querySelector('.choose-color .text-title .color').innerHTML = 'N/A';
         productDetail.querySelector('.choose-color').style.display = 'none'; // Hide color selection if no variations
    }

    // Add sizes if available
    if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach((item, index) => {
            const sizeItem = document.createElement('div');
            sizeItem.classList.add('size-item', 'flex', 'items-center', 'justify-center', 'text-button', 'rounded-full', 'bg-white', 'border', 'border-line', 'cursor-pointer');
            if (item.toLowerCase() === 'freesize') {
                sizeItem.classList.add('px-3', 'py-2');
            } else {
                sizeItem.classList.add('w-12', 'h-12');
            }
            if (index === 0) sizeItem.classList.add('active'); // Set first size as active by default
            sizeItem.setAttribute('data-size', item);
            sizeItem.innerHTML = item;
            listSize && listSize.appendChild(sizeItem);
        });
        // Update displayed size name
        const initialSize = product.sizes[0] || '';
        productDetail.querySelector('.choose-size .text-title .size').innerHTML = initialSize;
    } else {
        productDetail.querySelector('.choose-size .text-title .size').innerHTML = 'N/A';
        productDetail.querySelector('.choose-size').style.display = 'none'; // Hide size selection if no sizes
    }


    const listCategory = productDetail.querySelector('.list-category');
    if (listCategory) {
        listCategory.innerHTML = `
            <a href="shop.html" class="text-secondary">${product.category || 'N/A'},</a>
            <a href="shop.html" class="text-secondary"> ${product.gender || 'N/A'}</a>
        `;
    }

    const listTag = productDetail.querySelector('.list-tag');
    if (listTag) {
        listTag.innerHTML = `
            <a href="shop.html" class="text-secondary">${product.type || 'N/A'}</a>
        `;
    }

    // SKU and other static details (example values)
    productDetail.querySelector('.more-infor .text-secondary:nth-of-type(1)').innerHTML = '53453412'; // Assuming SKU is static for now
}

// Function to handle color and size selection
function handleColorAndSizeSelection(product) {
    const colorItems = productDetail.querySelectorAll('.choose-color .list-color .color-item');
    const sizeItems = productDetail.querySelectorAll('.choose-size .list-size .size-item');
    const selectedColorDisplay = productDetail.querySelector('.choose-color .text-title .color');
    const selectedSizeDisplay = productDetail.querySelector('.choose-size .text-title .size');

    colorItems.forEach(item => {
        item.addEventListener('click', () => {
            colorItems.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            selectedColorDisplay.innerHTML = item.getAttribute('data-color');
            // You might want to update the main product image here based on the selected color
            // For now, we only update the text.
        });
    });

    sizeItems.forEach(item => {
        item.addEventListener('click', () => {
            sizeItems.forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            selectedSizeDisplay.innerHTML = item.getAttribute('data-size');
        });
    });
}

// Function to handle quantity change
function handleQuantityChange(product) {
    const quantityBlock = productDetail.querySelector('.quantity-block');
    const minusBtn = quantityBlock.querySelector('.ph-minus');
    const plusBtn = quantityBlock.querySelector('.ph-plus');
    const quantityDisplay = quantityBlock.querySelector('.quantity');

    let currentQuantity = parseInt(quantityDisplay.textContent);

    minusBtn.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            quantityDisplay.textContent = currentQuantity;
            product.quantityPurchase = currentQuantity; // Update product object
        }
    });

    plusBtn.addEventListener('click', () => {
        // You might want to add a check for maximum available quantity here (product.quantity)
        if (currentQuantity < product.quantity) { // Assuming product.quantity is the max available
            currentQuantity++;
            quantityDisplay.textContent = currentQuantity;
            product.quantityPurchase = currentQuantity; // Update product object
        } else {
            alert(`Only ${product.quantity} items are available!`);
        }
    });
}

// Function to set up Add to Cart functionality
function setupAddToCart(product) {
    const addToCartBtn = productDetail.querySelector('.add-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const selectedColor = productDetail.querySelector('.choose-color .color-item.active')?.getAttribute('data-color') || 'N/A';
            const selectedSize = productDetail.querySelector('.choose-size .size-item.active')?.getAttribute('data-size') || 'N/A';
            const quantityToPurchase = parseInt(productDetail.querySelector('.quantity-block .quantity').textContent);

            const itemToAdd = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.thumbImage[0] || product.images[0], // Use thumbImage or first gallery image
                color: selectedColor,
                size: selectedSize,
                quantity: quantityToPurchase,
                // Add any other relevant details
            };

            // Implement your cart logic here (e.g., store in localStorage, send to API)
            console.log('Adding to cart:', itemToAdd);
            alert(`${quantityToPurchase} x ${product.name} (Color: ${selectedColor}, Size: ${selectedSize}) added to cart!`);

            // Example: Add to a global cart array (in a more complex app, this would be a service)
            // let cart = JSON.parse(localStorage.getItem('cart')) || [];
            // cart.push(itemToAdd);
            // localStorage.setItem('cart', JSON.stringify(cart));
        });
    }
}

// Function to set up Buy It Now functionality
function setupBuyItNow(product) {
    const buyItNowBtn = productDetail.querySelector('.button-block .button-main');
    if (buyItNowBtn) {
        buyItNowBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const selectedColor = productDetail.querySelector('.choose-color .color-item.active')?.getAttribute('data-color') || 'N/A';
            const selectedSize = productDetail.querySelector('.choose-size .size-item.active')?.getAttribute('data-size') || 'N/A';
            const quantityToPurchase = parseInt(productDetail.querySelector('.quantity-block .quantity').textContent);

            const itemToBuy = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.thumbImage[0] || product.images[0],
                color: selectedColor,
                size: selectedSize,
                quantity: quantityToPurchase,
            };

            // Implement your direct checkout logic here
            console.log('Buying now:', itemToBuy);
            alert(`Proceeding to checkout with ${quantityToPurchase} x ${product.name} (Color: ${selectedColor}, Size: ${selectedSize}).`);

            // Example: Store in sessionStorage for immediate checkout
            sessionStorage.setItem('buyNowItem', JSON.stringify(itemToBuy));
            window.location.href = buyItNowBtn.href; // Redirect to checkout page
        });
    }
}


// desc-tab
const descTabItem = document.querySelectorAll('.desc-tab .tab-item')
const descItem = document.querySelectorAll('.desc-tab .desc-block .desc-item')

descTabItem.forEach(tabItems => {
    const handleOpen = () => {
        let dataItem = tabItems.innerHTML.replace(/\s+/g, '')

        descItem.forEach(item => {
            if (item.getAttribute('data-item') === dataItem) {
                item.classList.add('open')
            } else {
                item.classList.remove('open')
            }
        })

        // Remove active class from all tabs and add to clicked one
        descTabItem.forEach(tab => tab.classList.remove('active'));
        tabItems.classList.add('active');
    }

    if (tabItems.classList.contains('active')) {
        handleOpen()
    }

    tabItems.addEventListener('click', handleOpen)
})


// list-img on-sale
var swiperListImgOnSale = new Swiper(".swiper-img-on-sale", {
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false,
    },
    clickable: true,
    slidesPerView: 2,
    spaceBetween: 0,
    breakpoints: {
        576: {
            slidesPerView: 2,
        },
        640: {
            slidesPerView: 2,
        },
        768: {
            slidesPerView: 2,
        },
        992: {
            slidesPerView: 3,
        },
        1290: {
            slidesPerView: 3,
        },
        2000: {
            slidesPerView: 4,
        },
    },
});


// list-img review
var swiperImgReview = new Swiper(".swiper-img-review", {
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false,
    },
    clickable: true,
    slidesPerView: 3,
    spaceBetween: 12,
    breakpoints: {
        576: {
            slidesPerView: 4,
            spaceBetween: 16,
        },
        640: {
            slidesPerView: 5,
            spaceBetween: 16,
        },
        768: {
            slidesPerView: 4,
            spaceBetween: 16,
        },
        992: {
            slidesPerView: 5,
            spaceBetween: 20,
        },
        1100: {
            slidesPerView: 5,
            spaceBetween: 20,
        },
        1290: {
            slidesPerView: 7,
            spaceBetween: 20,
        },
    },
});


// Redirect filter type product-sidebar
const typeItems = document.querySelectorAll('.product-detail.sidebar .list-type .item')

typeItems.forEach(item => {
    item.addEventListener('click', () => {
        const type = item.getAttribute('data-item');
        window.location.href = `shop.html?type=${type}`
    })
})