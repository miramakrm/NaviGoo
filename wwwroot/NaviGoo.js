document.addEventListener("DOMContentLoaded", async function () {
  const ratingStars = document.querySelectorAll(".rating");
     const ratingInput = document.getElementById("rating-input");
  
    function highlightStars(rating) {
      ratingStars.forEach((star) => {
        const starRating = star.getAttribute("data-rating");
        star.classList.toggle("fa-solid", starRating <= rating);
        star.classList.toggle("fa-regular", starRating > rating);
      });
    }
  
    ratingStars.forEach((star) => {
      star.addEventListener("mouseover", function () {
        highlightStars(this.getAttribute("data-rating"));
      });
  
      star.addEventListener("mouseout", function () {
        highlightStars(ratingInput.value || 0);
      });
  
      star.addEventListener("click", function () {
        const rating = this.getAttribute("data-rating");
        ratingInput.value = rating;
        highlightStars(rating);
      });
  });

});
document.addEventListener("DOMContentLoaded", async function () 
{
  try{
    const response = await fetch('/recommendations');
    if(!response.ok)
    {
      throw new Error(`failed to fetch recommendations: ${response.statusText}`);

    }
  const recommendedData = await response.json();
  populateSelection(recommendedData);
  updateRecommendation(recommendedData);
  }catch (error) {
    console.error("Failed to fetch recommendations:", error);
    alert("Failed to fetch recommendations. Please try again.");
  }
});
document.querySelector("#addRecommendationForm").addEventListener("submit", async function (event) {
event.preventDefault();
const formData=new FormData(this);
const recommendationTitle= formData.get("title").toLowerCase().trim();
InputValidation(recommendationTitle);
const dropDown=document.getElementById("Idd");
const options=dropDown.options;
let repeated= false;
for(let i=0; i<options.length;i++)
{
  if(options[i].text.toLowerCase()===recommendationTitle)
  {
    repeated=true;
    break;
  }
}

if(repeated)
{
  alert("This recommendation already exists");
  return;
}
try{
  const response = await fetch('/add-recommendation', {
    method: "POST",
    body: formData,
  });
  if(!response.ok)
  {
    throw new Error(`Failed to add recommendation: ${response.statusText}`);
  }
  const recommendedData = await response.json();
updateRecommendation(recommendedData);
location.reload();

}
catch (error) {
  console.error("Failed to add recommendation:", error);
  alert("Failed to add a new recommendation. Please try again.");
}
});
const prevControl = document.querySelector('.carousel-control-prev');
const nextControl = document.querySelector('.carousel-control-next');

if (prevControl) {
  prevControl.addEventListener('click', function () {
    const carousel = document.querySelector('#recommendedTripsCarousel');
    if (carousel) {
      const carouselInstance = new bootstrap.Carousel(carousel);
      carouselInstance.prev();
    }
  });
}

if (nextControl) {
  nextControl.addEventListener('click', function () {
    const carousel = document.querySelector('#recommendedTripsCarousel');
    if (carousel) {
      const carouselInstance = new bootstrap.Carousel(carousel);
      carouselInstance.next();
    }
  });
}
function updateRecommendation(recommendedData) {
  const recommendationContainer = document.querySelector("#carouselContent");
  
  if (recommendationContainer) {

    recommendationContainer.innerHTML = '';


    for (let i = 0; i < recommendedData.length; i += 3) {
      const slideDiv = document.createElement("div");
      slideDiv.classList.add("carousel-item");
      

      if (i === 0) {
        slideDiv.classList.add("active");
      }
      
    
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("row", "justify-content-center");
      

      for (let j = 0; j < 3; j++) {
        if (i + j < recommendedData.length) {
          const recommendation = recommendedData[i + j];
          
          const colDiv = document.createElement("div");
          colDiv.classList.add("col-md-4");
          
          colDiv.innerHTML = `
            <div class="card shadow-sm h-100">
              <img src="${recommendation.imageUrl}" class="card-img-top" alt="${recommendation.title}" style="height:300px; object-fit: cover;">
              <div class="card-body text-center">
                <h5 class="card-title" style="color:#45507d; font-weight: 600;">${recommendation.title}</h5>
                <p class="card-text">${recommendation.description}</p>
                <span style="color: #061341; font-size: 20px;">Price: <strong style="color:#45507d;">${recommendation.price} ${recommendation.currency}</strong></span>
                <div class="d-flex justify-content-center mt-5">
                  <a href="#" class="btn btn-primary">Book Trip</a>
                </div>
              </div>
            </div>
          `;
          
          rowDiv.appendChild(colDiv);
        }
      }
      
      slideDiv.appendChild(rowDiv);
      recommendationContainer.appendChild(slideDiv);
    }
  }
}

const deleteRecommendationForm = document.querySelector('#deleteRecommendationForm');
if (deleteRecommendationForm) {
  deleteRecommendationForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const formData=new FormData(this);
  try{
    const response = await fetch('/delete-recommendation', {
      method: 'DELETE',
      body: formData
  });
  if(!response.ok)
  {
    throw new Error(`Failed to delete recommendation: ${response.statusText}`);
  }
  window.location.reload();
}
  catch (error) {
    console.error("error while deleting",error);
    // alert("Failed to delete recommendation. Please try again.2");
  }
});
}


function populateSelection(recommendedData) {
  const dropDown = document.getElementById("Idd");
  
  if (dropDown) {
    dropDown.innerHTML = ""; 
    
    const defaultOption = document.createElement("option");
    defaultOption.text = "Select a recommendation to delete";
    defaultOption.value = "";
    dropDown.appendChild(defaultOption);
    
    if (Array.isArray(recommendedData)) {
      recommendedData.forEach((recommendation) => {
        const option = document.createElement("option");
        option.text = recommendation.title;
        option.value = recommendation.title;
        dropDown.appendChild(option);
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const deleteRecommendationForm = document.querySelector('#deleteRecommendationForm');


  if (deleteRecommendationForm) {
 
    deleteRecommendationForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const dropDown = document.getElementById("Idd");
      const selectedTitle = dropDown.value;
      
      if (!selectedTitle) {
        alert("Please select a recommendation to delete");
        return;
      }
      
     

      const confirmDelete = confirm(`Are you sure you want to delete the recommendation: ${selectedTitle}?`);
      
      if (!confirmDelete) {
        return;
      }
     
      try {
        
        const formData = new FormData();
        formData.append('title', selectedTitle);
         
        const response = await fetch('/delete-recommendation', {  
          method: 'DELETE', 
          body: formData
            
        });
        const responseBody = await response.clone().text();
      
            
           
            if (!response.ok) {
              console.error("Error:", responseBody);
              // alert('Failed to delete recommendation from server. Please try again.');
              return; 
            }
        
           
            alert(`Recommendation "${selectedTitle}" has been deleted successfully.`);
            await refreshRecommendations();
          } catch (error) {
            console.error("Error while deleting:", error);
            // alert("Failed to delete recommendation. Please try again.");
            return; 
          }
    });  
}  
});

async function refreshRecommendations() {
  try {
    const response = await fetch('/recommendations');
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const recommendedData = await response.json();

    const recommendationContainer = document.querySelector("#carouselContent");
    if (recommendationContainer) {
      recommendationContainer.innerHTML = '';
    }

    populateSelection(recommendedData);
    updateRecommendation(recommendedData);
  } catch (error) {
    console.error("Failed to refresh recommendations:", error);
    alert("Failed to refresh recommendations. Please reload the page.");
  }
}
function InputValidation(input) {
  const trimmedValue = input.toString().trim();

  if (trimmedValue === "") {
    alert("Input is empty or contains only whitespace");
  }
}
