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
/**** detail ****/
/**** desc-tab ****/
/**** list-img on-sale ****/
/**** list-img review ****/
/**** Redirect filter type product-sidebar ****/


//safe parse JSON 

function safeJsonParse(jsonString, fallback = []) {
    // Check if the input is a string that might need parsing
    if (typeof jsonString !== 'string' || !jsonString) {
        return fallback;
    }
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        // Log the error but return the fallback to prevent the application from crashing.
        console.warn('JSON parsing failed:', e.message, 'for product data:', jsonString);
        return fallback;
    }
}

let selectedQuantity = 1;

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
    };
}


if (productDetail) {
    fetch('/api/admin/products')
        .then(response => response.json())
        .then(data => {
            const mappedProducts = data.map(mapApiProductToFrontend);
            let productMain = mappedProducts.find(product => product.id === productId);

            // find location of current product in array
            currentIndex = mappedProducts.findIndex(product => product.id === productId);

            // Next, Prev products when click button
            const prevBtn = document.querySelector('.breadcrumb-product .prev-btn')
            const nextBtn = document.querySelector('.breadcrumb-product .next-btn')

            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % mappedProducts.length;
                const nextProduct = mappedProducts[currentIndex];
                window.location.href = `product-${typePage}.html?id=${nextProduct.id}`
            })

            if (productId === '1') {
                prevBtn.remove()
            } else {
                prevBtn.addEventListener('click', () => {
                    currentIndex = (currentIndex - 1) % mappedProducts.length;
                    const nextProduct = mappedProducts[currentIndex];
                    window.location.href = `product-${typePage}.html?id=${nextProduct.id}`
                })
            }

            // list-img
            const listImg2 = productDetail.querySelector('.featured-product .list-img .mySwiper2 .swiper-wrapper')
            const listImg = productDetail.querySelector('.featured-product .list-img .mySwiper .swiper-wrapper')
            const listImgMain = productDetail.querySelector('.featured-product .list-img .popup-img .swiper-wrapper')
            const popupImg = productDetail.querySelector('.featured-product .list-img .popup-img')

            if (listImg2 && listImg) {
                productMain.images.map(item => {
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
                    slides[0].classList.add('swiper-slide-thumb-active')

                    slides.forEach((img, index) => {
                        img.addEventListener('click', () => {
                            // Chuyển swiper 2 đến vị trí tương ứng với ảnh được click trong swiper 1
                            swiper2.slideTo(index);
                        });
                    });
                })
            }

            // list-img countdown timer
            const listImg3 = productDetail.querySelector('.featured-product.countdown-timer .list-img .list')
            if (listImg3) {
                productMain.images.map(item => {
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

            if (listImg4) {
                productMain.images.forEach((item, index) => {
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

            if (listImg5) {
                productMain.images.map(item => {
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

            if (listImg6) {
                productMain.images.forEach((item, index) => {
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
                    if (productMain.images.length < 4) {
                        console.log(false);
                        if (index === 2) {
                            imgItem.classList.add('md:row-span-2', 'row-span-1', 'col-span-1', 'max-md:aspect-[3/4]', 'lg:rounded-[20px]', 'rounded-xl', 'overflow-hidden')
                        }
                    } else {
                        console.log(true);
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
            if (productSale) {
                const percentSold = productSale.querySelector('.percent-sold')
                const percentSoldNumber = productSale.querySelector('.percent-sold-number')
                const remainingNumber = productSale.querySelector('.remaining-number')

                percentSold.style.width = Math.floor((productMain.sold / productMain.quantity) * 100) + '%'
                percentSoldNumber.innerHTML = Math.floor((productMain.sold / productMain.quantity) * 100) + '% Sold -'
                remainingNumber.innerHTML = productMain.quantity - productMain.sold
            }

            // show, hide popup img
            const imgItems = productDetail.querySelectorAll('.list-img .popup-link>img')
            const closePopupBtn = productDetail.querySelector('.list-img .popup-img .close-popup-btn')

            imgItems.forEach((item, index) => {
                item.addEventListener("click", () => {
                    console.log(index);
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

            // infor
            productDetail.querySelector('.product-infor').setAttribute('data-item', productId)
            productDetail.querySelector('.product-category').innerHTML = productMain.category
            productDetail.querySelector('.product-name').innerHTML = productMain.name
            productDetail.querySelector('.product-description').innerHTML = productMain.description
            productDetail.querySelector('.product-price').innerHTML = '₹' + productMain.price + '.00'
            productDetail.querySelector('.product-origin-price').innerHTML = '<del>₹' + productMain.originPrice + '.00</del>'
            productDetail.querySelector('.product-sale').innerHTML = '-' + Math.floor(100 - ((productMain.price / productMain.originPrice) * 100)) + '%'

            // Call new functions here after productMain is available
            // updateColors(productMain.variations); // Assuming 'variations' contains colors
            // updateSizes(productMain.sizes);
            // setupQuantitySelector(productMain.quantityPurchase); // Pass initial quantity (e.g., 1)
            updateEstimatedDelivery(); // Sets date to 10 days from today
            updateSKU(productMain.quantity); // Using product quantity as SKU
            updateCategories(productMain.category, productMain.gender); // Pass category and gender

            productMain.variation.map((item) => {
                const colorItem = document.createElement('div')
                colorItem.classList.add('color-item', 'w-12', 'h-12', 'rounded-xl', 'duration-300', 'relative')
                colorItem.innerHTML =
                    `
                        <img src='${item.colorImage}' alt='color' class='rounded-xl' />
                        <div
                            class="tag-action bg-black text-white caption2 capitalize px-1.5 py-0.5 rounded-sm">
                            ${item.color}
                        </div>
                    `

                productDetail.querySelector('.choose-color .list-color') && productDetail.querySelector('.choose-color .list-color').appendChild(colorItem)
            })

            productMain.sizes.map((item) => {
                const sizeItem = document.createElement('div')
                if (item !== 'freesize') {
                    sizeItem.classList.add('size-item', 'w-12', 'h-12', 'flex', 'items-center', 'justify-center', 'text-button', 'rounded-full', 'bg-white', 'border', 'border-line')
                } else {
                    sizeItem.classList.add('size-item', 'px-3', 'py-2', 'flex', 'items-center', 'justify-center', 'text-button', 'rounded-full', 'bg-white', 'border', 'border-line')
                }
                sizeItem.innerHTML = item

                productDetail.querySelector('.choose-size .list-size') && productDetail.querySelector('.choose-size .list-size').appendChild(sizeItem)
            })

            const listCategory = productDetail.querySelector('.list-category')

            listCategory.innerHTML = `
            <a href="shop.html" class="text-secondary">${productMain.category},</a>
            <a href="shop.html" class="text-secondary"> ${productMain.gender}</a>
            `

            const listTag = productDetail.querySelector('.list-tag')

            listTag.innerHTML = `
            <a href="shop.html" class="text-secondary">${productMain.type}</a>
            `
        })
        .catch(error => console.error('Error fetching products:', error));
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

// Function to update color display
function updateColors(variations) {
    const listColorContainer = productDetail.querySelector('.choose-color .list-color');
    const colorText = productDetail.querySelector('.choose-color .color');

    if (!listColorContainer || !colorText) {
        console.error("Error: Could not find color display elements. Check your HTML selectors.");
        return; // Exit if elements are not found
    }

    listColorContainer.innerHTML = ''; // Clear previous colors

    // Ensure variations.colors exists and is an array with items
    if (variations && variations.colors && Array.isArray(variations.colors) && variations.colors.length > 0) {
        variations.colors.forEach(item => {
            const colorItem = document.createElement('div');
            colorItem.classList.add('color-item', 'w-12', 'h-12', 'rounded-xl', 'duration-300', 'relative', 'cursor-pointer', 'overflow-hidden'); // Added overflow-hidden

            // Set background color using hex or colorImage as a fallback
            if (item.hex) {
                colorItem.style.backgroundColor = item.hex;
                // Add a border for light colors like white for visibility
                if (['#FFFFFF', '#FFF', 'white'].includes(item.hex.toLowerCase())) {
                    colorItem.style.border = '1px solid #e0e0e0';
                }
            } else if (item.colorImage) {
                // Fallback to image if hex is not provided, using it as background
                colorItem.style.backgroundImage = `url('${item.colorImage}')`;
                colorItem.style.backgroundSize = 'cover';
                colorItem.style.backgroundPosition = 'center';
                colorItem.style.backgroundRepeat = 'no-repeat';
            } else {
                // If neither hex nor colorImage, use a default fallback (e.g., grey)
                colorItem.style.backgroundColor = '#cccccc';
            }


            // Add the color name tag
            colorItem.innerHTML += `
                <div class="tag-action bg-black text-white caption2 capitalize px-1.5 py-0.5 rounded-sm absolute bottom-1 left-1/2 -translate-x-1/2 text-xs">
                    ${item.color}
                </div>
            `;

            colorItem.addEventListener('click', () => {
                // Remove 'active' class from all color items
                listColorContainer.querySelectorAll('.color-item').forEach(el => el.classList.remove('active'));
                // Add 'active' class to the clicked item
                colorItem.classList.add('active');
                colorText.textContent = item.color; // Update selected color text
            });
            listColorContainer.appendChild(colorItem);
        });

        // Set initial selected color if available
        const firstColorItem = listColorContainer.querySelector('.color-item');
        if (firstColorItem) {
            firstColorItem.classList.add('active');
            colorText.textContent = variations.colors[0].color;
        }
    } else {
        colorText.textContent = 'N/A'; // No colors available
        console.warn("No colors found in variations data or variations.colors is not an array.");
    }
}

// Function to update size display
function updateSizes(sizes) {
    const listSizeContainer = productDetail.querySelector('.choose-size .list-size');
    const sizeText = productDetail.querySelector('.choose-size .size');

    if (!listSizeContainer || !sizeText) {
        console.error("Error: Could not find size display elements. Check your HTML selectors.");
        return; // Exit if elements are not found
    }

    listSizeContainer.innerHTML = ''; // Clear previous sizes

    // Ensure sizes exists and is an array with items
    if (Array.isArray(sizes) && sizes.length > 0) {
        sizes.forEach(item => {
            const sizeItem = document.createElement('div');
            sizeItem.classList.add('size-item', 'w-12', 'h-12', 'flex', 'items-center', 'justify-center', 'text-button', 'rounded-full', 'bg-white', 'border', 'border-line', 'cursor-pointer');

            // Special handling for 'freesize'
            if (item.toLowerCase() === 'freesize') { // Use toLowerCase for robust comparison
                sizeItem.classList.remove('w-12', 'h-12');
                sizeItem.classList.add('px-3', 'py-2'); // Adjust padding for freesize
            }
            sizeItem.innerHTML = item; // Display the size text

            sizeItem.addEventListener('click', () => {
                // Remove 'active' class from all size items
                listSizeContainer.querySelectorAll('.size-item').forEach(el => el.classList.remove('active'));
                // Add 'active' class to the clicked item
                sizeItem.classList.add('active');
                sizeText.textContent = item; // Update selected size text
            });
            listSizeContainer.appendChild(sizeItem);
        });

        // Set initial selected size if available
        const firstSizeItem = listSizeContainer.querySelector('.size-item');
        if (firstSizeItem) {
            firstSizeItem.classList.add('active');
            sizeText.textContent = sizes[0];
        }
    } else {
        sizeText.textContent = 'N/A'; // No sizes available
        console.warn("No sizes found in sizes data or sizes is not an array.");
    }
}

// --- Mocking Backend Data and Initialization ---

// This simulates the product data you would get from your backend API
// AFTER you have JSON.parse()'d the 'sizes' and 'variations' fields.
const mockProductData = {
    id: 1,
    name: "Quilt",
    price: 29.99,

    parsedVariations: {
        colors: [
            { color: "Red", hex: "#E53E3E" },
            { color: "Blue", hex: "#3182CE" },
            { color: "Black", hex: "#000000" },
        ]
    },
    parsedSizes: ["S", "M", "L", "XL", "XXL", "Freesize"]
};

// Call the update functions when the DOM is ready or after fetching data
document.addEventListener('DOMContentLoaded', () => {
    // Check if productDetail was successfully selected
    if (productDetail) {
        updateColors(mockProductData.parsedVariations);
        updateSizes(mockProductData.parsedSizes);
    } else {
        console.error("Critical Error: 'productDetail' element not found in the DOM. Please check your HTML structure and the selector.");
    }
});


// Function to handle quantity selection
function setupQuantitySelector(initialQuantity = 1) {
    const quantityBlock = productDetail.querySelector('.choose-quantity .quantity-block');
    const quantityDisplay = quantityBlock ? quantityBlock.querySelector('.quantity') : null;
    const minusBtn = quantityBlock ? quantityBlock.querySelector('.ph-minus') : null;
    const plusBtn = quantityBlock ? quantityBlock.querySelector('.ph-plus') : null;

    if (quantityDisplay && minusBtn && plusBtn) {
        let currentQuantity = initialQuantity;
        quantityDisplay.textContent = currentQuantity;

        minusBtn.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                quantityDisplay.textContent = currentQuantity;
                // You might want to update a productMain.quantityPurchase here
            }
        });

        plusBtn.addEventListener('click', () => {
            currentQuantity++;
            quantityDisplay.textContent = currentQuantity;
            // You might want to update a productMain.quantityPurchase here
        });
    }
}

// Function to display estimated delivery date (10 days from today)
function updateEstimatedDelivery() {
    const estimatedDeliveryElement = productDetail.querySelector('.more-infor .flex.items-center.gap-1.mt-3:nth-of-type(2) .text-secondary');

    if (estimatedDeliveryElement) {
        const today = new Date();
        const deliveryStartDate = new Date(today);
        deliveryStartDate.setDate(today.getDate() + 10); // 10 days from today

        // Format dates as "DD Month" (e.g., "14 January")
        const options = { day: 'numeric', month: 'long' };
        const formattedDeliveryStartDate = deliveryStartDate.toLocaleDateString('en-US', options);

        // For a range, you might calculate an end date, e.g., 3 days after start
        const deliveryEndDate = new Date(deliveryStartDate);
        deliveryEndDate.setDate(deliveryStartDate.getDate() + 3);
        const formattedDeliveryEndDate = deliveryEndDate.toLocaleDateString('en-US', options);

        estimatedDeliveryElement.textContent = `${formattedDeliveryStartDate} - ${formattedDeliveryEndDate}`;
    }
}

// Function to update SKU
function updateSKU(quantityFromBackend) {
    const skuElement = productDetail.querySelector('.more-infor .flex.items-center.gap-1.mt-3:nth-of-type(4) .text-secondary');
    if (skuElement) {
        skuElement.textContent = quantityFromBackend; // Using quantity from backend as SKU
    }
}

// Function to update Categories, ensuring only one is displayed
function updateCategories(category, gender) {
    const listCategoryElement = productDetail.querySelector('.list-category');
    if (listCategoryElement) {
        listCategoryElement.innerHTML = ''; // Clear previous categories

        if (category) {
            const categoryLink = document.createElement('a');
            categoryLink.href = 'shop.html';
            categoryLink.classList.add('text-secondary');
            categoryLink.textContent = category;
            listCategoryElement.appendChild(categoryLink);
        }
        // If gender is needed, you can add it similarly, but the current request implies one primary category
        // if (gender) {
        //     const genderLink = document.createElement('a');
        //     genderLink.href = 'shop.html';
        //     genderLink.classList.add('text-secondary');
        //     genderLink.textContent = `, ${gender}`;
        //     listCategoryElement.appendChild(genderLink);
        // }
    }
}

// Renders the "You'll Love This Too" slider with related products.

function renderRelatedProductsSlider(allProducts, currentProduct) {
    const swiperWrapper = document.querySelector('.swiper-product-scroll .swiper-wrapper');
    if (!swiperWrapper || !currentProduct || !allProducts || allProducts.length === 0) {
        // Hide the section if no products or wrapper is found
        const relatedSection = document.querySelector('.list-product.hide-product-sold');
        if (relatedSection) relatedSection.style.display = 'none';
        return;
    }

    // 1. Filter for related products (same category/type, excluding the current product)
    const relatedProducts = allProducts.filter(product =>
        product.id !== currentProduct.id &&
        (product.category === currentProduct.category || product.type === currentProduct.type)
    );

    // If less than 4 related products, use products from a similar type, or just the whole list (excluding current)
    const finalProducts = relatedProducts.length > 0
        ? relatedProducts.slice(0, 8) // Limit to 8 products
        : allProducts.filter(product => product.id !== currentProduct.id).slice(0, 8);
    
    // Clear existing dummy slides
    swiperWrapper.innerHTML = ''; 

    // 2. Generate and inject the HTML for each related product
    finalProducts.forEach(product => {
        const productHTML = generateProductSlideHTML(product);
        swiperWrapper.insertAdjacentHTML('beforeend', productHTML);
    });

    // 3. Initialize Swiper (re-initialize or update)
    // NOTE: Swiper needs to be re-initialized or updated after dynamically adding slides.
    if (window.swiperCollection && typeof window.swiperCollection.destroy === 'function') {
        window.swiperCollection.destroy(true, true);
    }
    window.swiperCollection = new Swiper(".swiper-product-scroll", {
        // Re-use your existing Swiper configuration
        scrollbar: { el: ".swiper-scrollbar", hide: true },
        loop: false, // Keep loop off if you don't have many slides
        slidesPerView: 2,
        spaceBetween: 16,
        breakpoints: {
            640: { slidesPerView: 2, spaceBetween: 20 },
            1280: { slidesPerView: 3, spaceBetween: 20 },
        },
    });

    // Add event listeners to the new 'Add to Cart' buttons, etc. (Not implemented here, assumed elsewhere)
}

function generateProductSlideHTML(product) {
    // Calculate sale percentage if applicable
    const salePercentage = product.origin_price > product.price 
        ? Math.round(((product.origin_price - product.price) / product.origin_price) * 100)
        : null;

    // Determine sold/available quantity for the progress bar
    const totalQuantity = product.quantity;
    const soldQuantity = product.sold;
    const availableQuantity = totalQuantity - soldQuantity;
    const progressSoldWidth = totalQuantity > 0 ? (soldQuantity / totalQuantity) * 100 : 0;
    
    // Determine product tag (New/Sale)
    let tagHTML = '';
    if (product.is_new) {
        tagHTML = `<div class="product-tag text-button-uppercase bg-green px-3 py-0.5 inline-block rounded-full absolute top-3 left-3 z-[1]">New</div>`;
    } else if (salePercentage) {
        tagHTML = `<div class="product-tag text-button-uppercase bg-red px-3 py-0.5 inline-block rounded-full absolute top-3 left-3 z-[1]">Sale</div>`;
    }

    // Get the first image for the main/hover image
    const mainImage = product.main_image || product.thumb_image;
    const hoverImage = product.gallery && product.gallery.length > 1 ? product.gallery[1] : mainImage;

    return `
        <div class="swiper-slide">
            <div class="product-item grid-type" data-item="${product.id}">
                <a href="product-detail.html?id=${product.id}" class="product-main cursor-pointer block">
                    <div class="product-thumb bg-white relative overflow-hidden rounded-2xl">
                        ${tagHTML}
                        <div class="list-action-right absolute top-3 right-3 max-lg:hidden">
                            <div class="add-wishlist-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative">
                                <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Add To Wishlist</div>
                                <i class="ph ph-heart text-lg"></i>
                            </div>
                            <div class="compare-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative mt-2">
                                <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Compare Product</div>
                                <i class="ph ph-arrow-counter-clockwise text-lg compare-icon"></i>
                                <i class="ph ph-check-circle text-lg checked-icon"></i>
                            </div>
                        </div>
                        <div class="product-img w-full h-full aspect-[3/4]">
                            <img class="w-full h-full object-cover duration-700 main-img" src="${mainImage}" alt="${product.name}" />
                            <img class="w-full h-full object-cover duration-700 hover-img absolute top-0 left-0" src="${hoverImage}" alt="${product.name}" />
                        </div>
                        <div class="list-action grid grid-cols-2 gap-3 px-5 absolute w-full bottom-5 max-lg:hidden">
                            <div class="quick-view-btn w-full text-button-uppercase py-2 text-center rounded-full duration-300 bg-white hover:bg-black hover:text-white" data-product-id="${product.id}">Quick View</div>
                            <div class="add-cart-btn w-full text-button-uppercase py-2 text-center rounded-full duration-500 bg-white hover:bg-black hover:text-white" data-product-id="${product.id}">Add To Cart</div>
                        </div>
                    </div>
                    <div class="product-infor mt-4 lg:mb-7">
                        <div class="product-sold sm:pb-4 pb-2">
                            <div class="progress bg-line h-1.5 w-full rounded-full overflow-hidden relative">
                                <div class="progress-sold bg-red absolute left-0 top-0 h-full" style="width: ${progressSoldWidth}%"></div>
                            </div>
                            <div class="flex items-center justify-between gap-3 gap-y-1 flex-wrap mt-2">
                                <div class="text-button-uppercase">
                                    <span class="text-secondary2 max-sm:text-xs">Sold: </span>
                                    <span class="max-sm:text-xs">${soldQuantity}</span>
                                </div>
                                <div class="text-button-uppercase">
                                    <span class="text-secondary2 max-sm:text-xs">Available: </span>
                                    <span class="max-sm:text-xs">${availableQuantity}</span>
                                </div>
                            </div>
                        </div>
                        <div class="product-name text-title duration-300">${product.name}</div>
                        
                        <div class="product-price-block flex items-center gap-2 flex-wrap mt-1 duration-300 relative z-[1]">
                            <div class="product-price text-title">₹${product.price.toFixed(2)}</div>
                            ${product.origin_price > product.price ? `
                                <div class="product-origin-price caption1 text-secondary2">
                                    <del>₹${product.origin_price.toFixed(2)}</del>
                                </div>
                                <div class="product-sale caption1 font-medium bg-green px-3 py-0.5 inline-block rounded-full">
                                    -${salePercentage}%
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </a>
            </div>
        </div>
    `;
}

renderRelatedProductsSlider(allProducts, productData);