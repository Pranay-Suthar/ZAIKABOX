const randomMealBtn = document.querySelector('#random-meal');
const mealContainer = document.querySelector('.meal-container');

randomMealBtn.addEventListener('click', () => {
    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        .then(response => response.json())
        .then(data => data.meals[0])
        .then(meal => createMeal(meal))
        .catch(error => console.error(error));
});

const getIngredients = (meal, num = 1) => {
    return  meal[`strIngredient${num}`] 
        ? [{
            'name': meal[`strIngredient${num}`], 
            'amount': meal[`strMeasure${num}`]
        }].concat(getIngredients(meal, num + 1)):  '';
}

const createMeal = (meal) => {
    const ingredients = getIngredients(meal).slice(0, -1); // remove last item

    // remove inconsistencies in the data as much as possible and format it accordingly
    const instructions = meal.strInstructions
        .trim()
        .replace(/^\.?(?:(?:STEP\s)?[0-9]\.?(?:\s|\s\1)*)?|(\s?\r\n)+(?:(?:\s?STEP)?\s?\d+\.?\1*)?|(\.$)|(?<!\.\s?)(\r\n)+/gi, (m, g1, g2, g3) => {
            if (g1) return `</li>\n<li class="steps">`;
            else if (g2) return `.</li>`;
            else if (g3) return '';
            else return `<li class="steps">`;
        });

    mealContainer.innerHTML = `
        <header class="flex-row">
            <h2 id="meal-title">${meal.strMeal}</h2>
        </header>
        <section class="meal-content">
            <section class="primary">
                <section class="thumbnail-container">
                    <img src='${meal.strMealThumb}' alt='${meal.strMeal}' title='${meal.strMeal}'>
                </section>

                <section class="ingredients">
                    <header class="flex-row">
                        <h3 id="ingredient-title">Ingredients</h3>
                    </header>
                    <ol>
                        ${ingredients.length 
                            ? ingredients.map(ingredient => 
                                `<li><p>${ingredient.name}<span class="amount">${ingredient.amount}</span></p></li>`).join('\n') : ''}
                    </ol>
                </section>

                <section class="tags">
                    ${meal.strArea.toLowerCase() !== 'unknown'
                        ? `<div class="country"><i class="fa-solid fa-location-dot"></i> ${meal.strArea}</div>` : ''}
                    ${meal.strCategory 
                        ? `<div class="category"><i class="fa-solid fa-hashtag"></i> ${meal.strCategory}</div>` : ''}
                </section>
            </section>
    
            <section class="secondary">
                <section class="instructions">
                    <header class="flex-row">
                        <h3 id="instruction-title">Instructions</h3>
                    </header>
                    <ul>
                        ${instructions}
                    </ul>
                </section>

                ${meal.strYoutube ? 
                    `<section class="button-container flex-row">
                        <button id="watch-video" onclick="displayVideo('${meal.strYoutube.match(/(?<=\?v=).+/g)}')">
                            <i class="fa-solid fa-play"></i> 
                            Watch video
                        </button>
                    </section>` : ''}
            </section>
        </section>
    `;

    document.body.classList.remove('flex-column');
}

const displayVideo = (videoId) => {
    
    const [videoContainer, iframe, btn] = ['section', 'iframe', 'button'].map(elem => document.createElement(elem));

    videoContainer.classList.add('video-container', 'flex-row');
    videoContainer.addEventListener('click', () => videoContainer.remove());

    iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}`);
    iframe.setAttribute('allowfullscreen', '');

    btn.setAttribute('id', 'remove-video');
    btn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    btn.addEventListener('click', () => videoContainer.remove());

    [iframe, btn].forEach(elem => videoContainer.appendChild(elem));

    document.body.appendChild(videoContainer);
}