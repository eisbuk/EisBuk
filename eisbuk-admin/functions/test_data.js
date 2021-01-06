const functions = require("firebase-functions");
const admin = require("firebase-admin");
const timestamp = require("unix-timestamp");
var _ = require("lodash");
const { v4 } = require("uuid");
const uuidv4 = v4;

exports.createTestData = functions
  .region("europe-west6")
  .https.onCall(async (data, context) => {
    var howMany = data.howMany;
    if (typeof howMany === "undefined") {
      howMany = 1;
    }
    functions.logger.info(`Creating ${howMany} test users`);
    await create_users(howMany);
    return { success: true };
  });

const create_users = async function (howMany) {
  const db = admin.firestore();
  await _.range(howMany).map(async (i) => {
    const customer = {
      id: uuidv4(),
      name: getRandomName(FIRST_NAMES),
      surname: getRandomName(LAST_NAMES),
      birthday: "01/01/2000",
    };
    await db.collection("customers").doc(customer.id).set(customer);
    for (let i = 0; i < 5; i++) {
      /* eslint-disable no-await-in-loop */
      var updated_customer = await db
        .collection("customers")
        .doc(customer.id)
        .get(); // eslint-disable-line
      if (updated_customer.data().secret_key) {
        break;
      }
      console.log(`Attempt ${i} failed, retrying`);
    }
    const booking = {
      duration: 1,
      start: timestamp.add(timestamp.now(), _.random(-60, 60) + "d"),
      category: getRandomName(CATEGORIES),
    };
    await db
      .collection("bookings")
      .doc(updated_customer.data().secret_key)
      .collection("data")
      .add(booking);
  });
};

exports.createAdminTestUsers = functions
  .region("europe-west6")
  .https.onCall(async (data, context) => {
    try {
      console.log("hello");
      res = await admin.auth().createUser({
        email: "test@eisbuk.it",
        emailVerified: true,
        phoneNumber: "+11234567890",
        password: "test00",
        displayName: "Test User",
        disabled: false,
      });
    } catch (e) {
      console.log("Error creating test user");
      return { success: false };
    }
    return { success: true };
  });

const CATEGORIES = ["ice", "fitness"];

// prettier-ignore
const FIRST_NAMES = (["Mary","Anna","Emma","Elizabeth","Minnie","Margaret","Ida","Alice","Bertha","Sarah","Annie","Clara","Ella","Florence","Cora","Martha","Laura","Nellie","Grace","Carrie","Maude","Mabel","Bessie","Jennie","Gertrude","Julia","Hattie","Edith","Mattie","Rose","Catherine","Lillian","Ada","Lillie","Helen","Jessie","Louise","Ethel","Lula","Myrtle","Eva","Frances","Lena","Lucy","Edna","Maggie","Pearl","Daisy","Fannie","Josephine","Dora","Rosa","Katherine","Agnes","Marie","Nora","May","Mamie","Blanche","Stella","Ellen","Nancy","Effie","Sallie","Nettie","Della","Lizzie","Flora","Susie","Maud","Mae","Etta","Harriet","Sadie","Caroline","Katie","Lydia","Elsie","Kate","Susan","Mollie","Alma","Addie","Georgia","Eliza","Lulu","Nannie","Lottie","Amanda","Belle","Charlotte","Rebecca","Ruth","Viola","Olive","Amelia","Hannah","Jane","Virginia","Emily","Matilda","Irene","Kathryn","Esther","Willie","Henrietta","Ollie","Amy","Rachel","Sara","Estella","Theresa","Augusta","Ora","Pauline","Josie","Lola","Sophia","Leona","Anne","Mildred","Ann","Beulah","Callie","Lou","Delia","Eleanor","Barbara","Iva","Louisa","Maria","Mayme","Evelyn","Estelle","Nina","Betty","Marion","Bettie","Dorothy","Luella","Inez","Lela","Rosie","Allie","Millie","Janie","Cornelia","Victoria","Ruby","Winifred","Alta","Celia","Christine","Beatrice","Birdie","Harriett","Mable","Myra","Sophie","Tillie","Isabel","Sylvia","Carolyn","Isabelle","Leila","Sally","Ina","Essie","Bertie","Nell","Alberta","Katharine","Lora","Rena","Mina","Rhoda","Mathilda","Abbie","Eula","Dollie","Hettie","Eunice","Fanny","Ola","Lenora","Adelaide","Christina","Lelia","Nelle","Sue","Johanna","Lilly","Lucinda","Minerva","Lettie","Roxie","Cynthia","Helena","Hilda","Hulda","Bernice","Genevieve","Jean","Cordelia","Marian","Francis","Jeanette","Adeline","Gussie","Leah","Lois","Lura","Mittie","Hallie","Isabella","Olga","Phoebe","Teresa","Hester","Lida","Lina","Winnie","Claudia","Marguerite","Vera","Cecelia","Bess","Emilie","John","Rosetta","Verna","Myrtie","Cecilia","Elva","Olivia","Ophelia","Georgie","Elnora","Violet","Adele","Lily","Linnie","Loretta","Madge","Polly","Virgie","Eugenia","Lucile","Lucille","Mabelle","Rosalie","Kittie","Meta","Angie","Dessie","Georgiana","Lila","Regina","Selma","Wilhelmina","Bridget","Lilla","Malinda","Vina","Freda","Gertie","Jeannette","Louella","Mandy","Roberta","Cassie","Corinne","Ivy","Melissa","Lyda","Naomi","Norma","Bell","Margie","Nona","Zella","Dovie","Elvira","Erma","Irma","Leota","William","Artie","Blanch","Charity","Lorena","Lucretia","Orpha","Alvina","Annette","Catharine","Elma","Geneva","Janet","Lee","Leora","Lona","Miriam","Zora","Linda","Octavia","Sudie","Zula","Adella","Alpha","Frieda","George","Joanna","Leonora","Priscilla","Tennie","Angeline","Docia","Ettie","Flossie","Hanna","Letha","Minta","Retta","Rosella","Adah","Berta","Elisabeth","Elise","Goldie","Leola","Margret","Adaline","Floy","Idella","Juanita","Lenna","Lucie","Missouri","Nola","Zoe","Eda","Isabell","James","Julie","Letitia","Madeline","Malissa","Mariah","Pattie","Vivian","Almeda","Aurelia","Claire","Dolly","Hazel","Jannie","Kathleen","Kathrine","Lavinia","Marietta","Melvina","Ona","Pinkie","Samantha","Susanna","Chloe","Donnie","Elsa","Gladys","Matie","Pearle","Vesta","Vinnie","Antoinette","Clementine","Edythe","Harriette","Libbie","Lilian","Lue","Lutie","Magdalena","Meda","Rita","Tena","Zelma","Adelia","Annetta","Antonia","Dona","Elizebeth","Georgianna","Gracie","Iona","Lessie","Leta","Liza","Mertie","Molly","Neva","Oma","Alida","Alva","Cecile","Cleo","Donna","Ellie","Ernestine","Evie","Frankie","Helene","Minna","Myrta","Prudence","Queen","Rilla","Savannah","Tessie","Tina","Agatha","America","Anita","Arminta","Dorothea","Ira","Luvenia","Marjorie","Maybelle","Mellie","Nan","Pearlie","Sidney","Velma","Clare","Constance","Dixie",
    "John","William","James","Charles","George","Frank","Joseph","Thomas","Henry","Robert","Edward","Harry","Walter","Arthur","Fred","Albert","Samuel","David","Louis","Joe","Charlie","Clarence","Richard","Andrew","Daniel","Ernest","Will","Jesse","Oscar","Lewis","Peter","Benjamin","Frederick","Willie","Alfred","Sam","Roy","Herbert","Jacob","Tom","Elmer","Carl","Lee","Howard","Martin","Michael","Bert","Herman","Jim","Francis","Harvey","Earl","Eugene","Ralph","Ed","Claude","Edwin","Ben","Charley","Paul","Edgar","Isaac","Otto","Luther","Lawrence","Ira","Patrick","Guy","Oliver","Theodore","Hugh","Clyde","Alexander","August","Floyd","Homer","Jack","Leonard","Horace","Marion","Philip","Allen","Archie","Stephen","Chester","Willis","Raymond","Rufus","Warren","Jessie","Milton","Alex","Leo","Julius","Ray","Sidney","Bernard","Dan","Jerry","Calvin","Perry","Dave","Anthony","Eddie","Amos","Dennis","Clifford","Leroy","Wesley","Alonzo","Garfield","Franklin","Emil","Leon","Nathan","Harold","Matthew","Levi","Moses","Everett","Lester","Winfield","Adam","Lloyd","Mack","Fredrick","Jay","Jess","Melvin","Noah","Aaron","Alvin","Norman","Gilbert","Elijah","Victor","Gus","Nelson","Jasper","Silas","Jake","Christopher","Mike","Percy","Adolph","Maurice","Cornelius","Felix","Reuben","Wallace","Claud","Roscoe","Sylvester","Earnest","Hiram","Otis","Simon","Willard","Irvin","Mark","Jose","Wilbur","Abraham","Virgil","Clinton","Elbert","Leslie","Marshall","Owen","Wiley","Anton","Morris","Manuel","Phillip","Augustus","Emmett","Eli","Nicholas","Wilson","Alva","Harley","Newton","Timothy","Marvin","Ross","Curtis","Edmund","Jeff","Elias","Harrison","Stanley","Columbus","Lon","Ora","Ollie","Pearl","Russell","Solomon","Arch","Asa","Clayton","Enoch","Irving","Mathew","Nathaniel","Scott","Hubert","Lemuel","Andy","Ellis","Emanuel","Joshua","Millard","Vernon","Wade","Cyrus","Miles","Rudolph","Sherman","Austin","Bill","Chas","Lonnie","Monroe","Byron","Edd","Emery","Grant","Jerome","Max","Mose","Steve","Gordon","Abe","Pete","Chris","Clark","Gustave","Orville","Lorenzo","Bruce","Marcus","Preston","Bob","Dock","Donald","Jackson","Cecil","Barney","Delbert","Edmond","Anderson","Christian","Glenn","Jefferson","Luke","Neal","Burt","Ike","Myron","Tony","Conrad","Joel","Matt","Riley","Vincent","Emory","Isaiah","Nick","Ezra","Green","Juan","Clifton","Lucius","Porter","Arnold","Bud","Jeremiah","Taylor","Forrest","Roland","Spencer","Burton","Don","Emmet","Gustav","Louie","Morgan","Ned","Van","Ambrose","Chauncey","Elisha","Ferdinand","General","Julian","Kenneth","Mitchell","Allie","Josh","Judson","Lyman","Napoleon","Pedro","Berry","Dewitt","Ervin","Forest","Lynn","Pink","Ruben","Sanford","Ward","Douglas","Ole","Omer","Ulysses","Walker","Wilbert","Adelbert","Benjiman","Ivan","Jonas","Major","Abner","Archibald","Caleb","Clint","Dudley","Granville","King","Mary","Merton","Antonio","Bennie","Carroll","Freeman","Josiah","Milo","Royal","Dick","Earle","Elza","Emerson","Fletcher","Judge","Laurence","Neil","Roger","Seth","Glen","Hugo","Jimmie","Johnnie","Washington","Elwood","Gust","Harmon","Jordan","Simeon","Wayne","Wilber","Clem","Evan","Frederic","Irwin","Junius","Lafayette","Loren","Madison","Mason","Orval","Abram","Aubrey","Elliott","Hans","Karl","Minor","Wash","Wilfred","Allan","Alphonse","Dallas","Dee","Isiah","Jason","Johnny","Lawson","Lew","Micheal","Orin","Addison","Cal","Erastus","Francisco","Hardy","Lucien","Randolph","Stewart","Vern","Wilmer","Zack","Adrian","Alvah","Bertram","Clay","Ephraim","Fritz","Giles","Grover","Harris","Isom","Jesus","Johnie","Jonathan","Lucian","Malcolm","Merritt","Otho","Perley","Rolla","Sandy","Tomas","Wilford","Adolphus","Angus","Arther","Carlos","Cary","Cassius","Davis","Hamilton","Harve","Israel","Leander","Melville","Merle","Murray","Pleasant","Sterling","Steven","Axel","Boyd","Bryant","Clement","Erwin","Ezekiel","Foster","Frances","Geo","Houston","Issac","Jules","Larkin","Mat","Morton","Orlando","Pierce","Prince","Rollie","Rollin","Sim","Stuart","Wilburn","Bennett","Casper","Christ","Dell"]);
// prettier-ignore
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Garcia","Rodriguez","Wilson","Martinez","Anderson","Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White","Lopez","Lee","Gonzalez","Harris","Clark","Lewis","Robinson","Walker","Perez","Hall","Young","Allen","Sanchez","Wright","King","Scott","Green","Baker","Adams","Nelson","Hill","Ramirez","Campbell","Mitchell","Roberts","Carter","Phillips","Evans","Turner","Torres","Parker","Collins","Edwards","Stewart","Flores","Morris","Nguyen","Murphy","Rivera","Cook","Rogers","Morgan","Peterson","Cooper","Reed","Bailey","Bell","Gomez","Kelly","Howard","Ward","Cox","Diaz","Richardson","Wood","Watson","Brooks","Bennett","Gray","James","Reyes","Cruz","Hughes","Price","Myers","Long","Foster","Sanders","Ross","Morales","Powell","Sullivan","Russell","Ortiz","Jenkins","Gutierrez","Perry","Butler","Barnes","Fisher","Henderson","Coleman","Simmons","Patterson","Jordan","Reynolds","Hamilton","Graham","Kim","Gonzales","Alexander","Ramos","Wallace","Griffin","West","Cole","Hayes","Chavez","Gibson","Bryant","Ellis","Stevens","Murray","Ford","Marshall","Owens","Mcdonald","Harrison","Ruiz","Kennedy","Wells","Alvarez","Woods","Mendoza","Castillo","Olson","Webb","Washington","Tucker","Freeman","Burns","Henry","Vasquez","Snyder","Simpson","Crawford","Jimenez","Porter","Mason","Shaw","Gordon","Wagner","Hunter","Romero","Hicks","Dixon","Hunt","Palmer","Robertson","Black","Holmes","Stone","Meyer","Boyd","Mills","Warren","Fox","Rose","Rice","Moreno","Schmidt","Patel","Ferguson","Nichols","Herrera","Medina","Ryan","Fernandez","Weaver","Daniels","Stephens","Gardner","Payne","Kelley","Dunn","Pierce","Arnold","Tran","Spencer","Peters","Hawkins","Grant","Hansen","Castro","Hoffman","Hart","Elliott","Cunningham","Knight","Bradley","Carroll","Hudson","Duncan","Armstrong","Berry","Andrews","Johnston","Ray","Lane","Riley","Carpenter","Perkins","Aguilar","Silva","Richards","Willis","Matthews","Chapman","Lawrence","Garza","Vargas","Watkins","Wheeler","Larson","Carlson","Harper","George","Greene","Burke","Guzman","Morrison","Munoz","Jacobs","Obrien","Lawson","Franklin","Lynch","Bishop","Carr","Salazar","Austin","Mendez","Gilbert","Jensen","Williamson","Montgomery","Harvey","Oliver","Howell","Dean","Hanson","Weber","Garrett","Sims","Burton","Fuller","Soto","Mccoy","Welch","Chen","Schultz","Walters","Reid","Fields","Walsh","Little","Fowler","Bowman","Davidson","May","Day","Schneider","Newman","Brewer","Lucas","Holland","Wong","Banks","Santos","Curtis","Pearson","Delgado","Valdez","Pena","Rios","Douglas","Sandoval","Barrett","Hopkins","Keller","Guerrero","Stanley","Bates","Alvarado","Beck","Ortega","Wade","Estrada","Contreras","Barnett","Caldwell","Santiago","Lambert","Powers","Chambers","Nunez","Craig","Leonard","Lowe","Rhodes","Byrd","Gregory","Shelton","Frazier","Becker","Maldonado","Fleming","Vega","Sutton","Cohen","Jennings","Parks","Mcdaniel","Watts","Barker","Norris","Vaughn","Vazquez","Holt","Schwartz","Steele","Benson","Neal","Dominguez","Horton","Terry","Wolfe","Hale","Lyons","Graves","Haynes","Miles","Park","Warner","Padilla","Bush","Thornton","Mccarthy","Mann","Zimmerman","Erickson","Fletcher","Mckinney","Page","Dawson","Joseph","Marquez","Reeves","Klein","Espinoza","Baldwin","Moran","Love","Robbins","Higgins","Ball","Cortez","Le","Griffith","Bowen","Sharp","Cummings","Ramsey","Hardy","Swanson","Barber","Acosta","Luna","Chandler","Blair","Daniel","Cross","Simon","Dennis","Oconnor","Quinn","Gross","Navarro","Moss","Fitzgerald","Doyle","Mclaughlin","Rojas","Rodgers","Stevenson","Singh","Yang","Figueroa","Harmon","Newton","Paul","Manning","Garner","Mcgee","Reese","Francis","Burgess","Adkins","Goodman","Curry","Brady","Christensen","Potter","Walton","Goodwin","Mullins","Molina","Webster","Fischer","Campos","Avila","Sherman","Todd","Chang","Blake","Malone","Wolf","Hodges","Juarez","Gill","Farmer","Hines","Gallagher","Duran","Hubbard","Cannon","Miranda","Wang","Saunders","Tate","Mack","Hammond","Carrillo","Townsend","Wise","Ingram","Barton","Mejia","Ayala","Schroeder","Hampton","Rowe","Parsons","Frank","Waters","Strickland","Osborne","Maxwell","Chan","Deleon","Norman","Harrington","Casey","Patton","Logan","Bowers","Mueller","Glover","Floyd","Hartman","Buchanan","Cobb","French","Kramer","Mccormick","Clarke","Tyler","Gibbs","Moody","Conner","Sparks","Mcguire","Leon","Bauer","Norton","Pope","Flynn","Hogan","Robles","Salinas","Yates","Lindsey","Lloyd","Marsh","Mcbride","Owen","Solis","Pham","Lang","Pratt","Lara","Brock","Ballard","Trujillo","Shaffer","Drake","Roman","Aguirre","Morton","Stokes","Lamb","Pacheco","Patrick","Cochran","Shepherd","Cain","Burnett","Hess","Li","Cervantes","Olsen","Briggs","Ochoa","Cabrera","Velasquez","Montoya","Roth","Meyers","Cardenas","Fuentes","Weiss","Hoover","Wilkins","Nicholson","Underwood","Short","Carson","Morrow","Colon","Holloway","Summers","Bryan","Petersen","Mckenzie","Serrano","Wilcox","Carey","Clayton","Poole","Calderon","Gallegos","Greer","Rivas","Guerra","Decker","Collier","Wall","Whitaker","Bass","Flowers","Davenport","Conley","Houston","Huff","Copeland","Hood","Monroe","Massey","Roberson","Combs","Franco","Larsen","Pittman","Randall","Skinner","Wilkinson","Kirby","Cameron","Bridges","Anthony","Richard","Kirk","Bruce","Singleton","Mathis","Bradford","Boone","Abbott","Charles","Allison","Sweeney","Atkinson","Horn","Jefferson","Rosales","York","Christian","Phelps","Farrell","Castaneda","Nash","Dickerson","Bond","Wyatt","Foley","Chase","Gates","Vincent","Mathews","Hodge","Garrison","Trevino","Villarreal","Heath","Dalton","Valencia","Callahan","Hensley","Atkins","Huffman","Roy","Boyer","Shields","Lin","Hancock","Grimes","Glenn","Cline","Delacruz","Camacho","Dillon","Parrish","Oneill","Melton","Booth","Kane","Berg","Harrell","Pitts","Savage","Wiggins","Brennan","Salas","Marks","Russo","Sawyer","Baxter","Golden","Hutchinson","Liu","Walter","Mcdowell","Wiley","Rich","Humphrey","Johns","Koch","Suarez","Hobbs","Beard","Gilmore","Ibarra","Keith","Macias","Khan","Andrade","Ware","Stephenson","Henson","Wilkerson","Dyer","Mcclure","Blackwell","Mercado","Tanner","Eaton","Clay","Barron","Beasley","Oneal","Preston","Small","Wu","Zamora","Macdonald","Vance","Snow","Mcclain","Stafford","Orozco","Barry","English","Shannon","Kline","Jacobson","Woodard","Huang","Kemp","Mosley","Prince","Merritt","Hurst","Villanueva","Roach","Nolan","Lam","Yoder","Mccullough","Lester","Santana","Valenzuela","Winters","Barrera","Leach","Orr","Berger","Mckee","Strong","Conway","Stein","Whitehead","Bullock","Escobar","Knox","Meadows","Solomon","Velez","Odonnell","Kerr"]

function getRandomName(names) {
  return names[Math.floor(Math.random() * (names.length - 1))];
}
