import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const FILTERS = [
  "Branch",
  "City",
  "Customer_type",
  "Gender",
  "Product_line",
  "Date",
];
const SORTERS = [
  "Branch",
  "City",
  "Customer_type",
  "Gender",
  "Product_line",
  "Date",
];
const CHART_DATA_SHOW = [
  "Branch",
  "City",
  "Customer_type",
  "Gender",
  "Product_line",
];
const FILTER = "_filter";
const SORTER = "_sorter";
const CHART_SELECTOR = "_selector";
const DATA = "./data/supermarket_sales.csv";

const group_by = (data, fieldName) => {
  return d3.group(data, (item) => item[fieldName]);
};

const getData = async () =>
  await d3.csv(DATA, (res) => {
    res.Date = new Date(res.Date).toLocaleDateString("fr-CA");
    return res;
  });
const init_filters = () => {
  let filtersDiv = document.getElementById("filters");
  filtersDiv.innerHTML += `<h2>Фильтрация</h2>`;
  FILTERS.forEach((filter) => {
    let filterId = filter + FILTER;

    if (filter != "Date") {
      filtersDiv.innerHTML += `
                <input list="${filterId}" id="${filterId}-input" placeholder="Введите ${filter}...">
                <datalist id="${filterId}"></datalist>
            `;
    } else {
      filtersDiv.innerHTML += `
                <input list="${filterId}" id="${filterId}-input" placeholder="Дата с">
                <datalist id="${filterId}"></datalist>
                <input list="${filterId}1" id="${filterId}1-input" placeholder="Дата по">
                <datalist id="${filterId}1"></datalist>
            `;
    }
  });
};

const init_sorters = () => {
  let sortersDiv = document.getElementById("sorters");

  sortersDiv.innerHTML += `<h2>Сортировка</h2>`;
  for (let index = 1; index <= SORTERS.length; index++) {
    let tmp = "";
    tmp += `<br> ${index}-уровень сортировки: <br>
        <select id="_${index}${SORTER}">
        <option value="NS">NS</option> 
        `;
    SORTERS.forEach((sorter) => {
      tmp += `<option value="${sorter}">${sorter}</option>`;
    });
    tmp += `</select>`;
    sortersDiv.innerHTML += tmp;
  }
};

const fill_filters = (data) => {
  FILTERS.forEach((filter) => {
    const keys = group_by(data, filter).keys().toArray().sort();
    d3.select("#" + filter + FILTER)
      .selectAll("option")
      .data(keys)
      .join("option")
      .attr("value", (keys) => keys);
    d3.select("#" + filter + FILTER + "1")
      .selectAll("option")
      .data(keys)
      .join("option")
      .attr("value", (keys) => keys);
  });
};

const get_sorters_data = () => {
  let sorters_values = Array(SORTERS.length)
    .keys()
    .map((element) => {
      return document.getElementById(`_${element + 1}${SORTER}`).value;
    })
    .filter((x) => x != "NS")
    .toArray();
  return sorters_values;
};

const get_filters_data = () => {
  return FILTERS.map((filter) => {
    return filter != "Date"
      ? [filter, document.getElementById(filter + FILTER + "-input").value]
      : [
          [
            "Date from",
            document.getElementById(filter + FILTER + "-input").value,
          ],
          [
            "Date to",
            document.getElementById(filter + FILTER + "1" + "-input").value,
          ],
        ];
  }).filter((x) => x[1].length > 0);
};

const init_chart_settings = () => {
  const chartSelectorsDiv = document.getElementById("chartSelectors");
  chartSelectorsDiv.innerHTML += `<h2>Настройки</h2>`;
  chartSelectorsDiv.innerHTML += `<h3>Поле группировки</h3>`;
  chartSelectorsDiv.innerHTML += `<select name="${CHART_SELECTOR}" id="${CHART_SELECTOR}"></select>`;
  chartSelectorsDiv.innerHTML += `<h3>Аггрегирующая функция</h3>`;
  chartSelectorsDiv.innerHTML += `<select name="${
    CHART_SELECTOR + "Aggregation"
  }" id="${CHART_SELECTOR + "Aggregation"}">
     <option value="sum">sum</option>
     <option value="mean">mean</option>
     <option value="min">min</option>
     <option value="max">max</option>
   </select>`;
  d3.select("#" + CHART_SELECTOR)
    .selectAll("option")
    .data(CHART_DATA_SHOW)
    .join("option")
    .html((data) => `<option value="${data}">${data}</option>`);
};

const add_build_callback = () => {
  document.getElementById("build").addEventListener("click", build_callback);
};

const multi_field_sort = (data, fields) => {
  return data.sort((a, b) => {
    for (let field of fields) {
      // Получаем значения полей для сравнения
      let aValue = String(a[field]);
      let bValue = String(b[field]);

      // Сравниваем значения текущего поля
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
    }

    return 0;
  });
};

const fillTable = (data) => {
  d3.select("#content tbody")
    .selectAll("tr")
    .data(data)
    .join("tr")
    .html(
      (row) => `<tr>
                  <td>${row.Date}</td>
                  <td>${row.Branch}</td>
                  <td>${row.City}</td>
                  <td>${row.Customer_type}</td>
                  <td>${row.Gender}</td>
                  <td>${row.Product_line}</td>
                  <td>${row.Total}</td>
                </tr>`
    );
};

const draw_chart = (data) => {
  const width = 1200;
  const height = 800;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 30;
  const animationDuration = 3000;

  let resData = [];

  let show = document.getElementById(CHART_SELECTOR).value;
  let aggregation = document.getElementById(
    CHART_SELECTOR + "Aggregation"
  ).value;

  const svg = d3.select("#chart").attr("width", width).attr("height", height);

  const groupX = d3.group(data, (d) => d.Date);
  const axesXData = groupX.keys();
  for (const axesXItem of axesXData) {
    const groupY = d3.group(groupX.get(axesXItem), (d) => d[show]);
    const axesYData = groupY.keys();
    for (const axesYItem of axesYData) {
      const viewData = d3[aggregation](groupY.get(axesYItem), (d) => +d.Total);
      resData.push({ axesXItem, axesYItem, viewData });
    }
  }

  const xScale = d3
    .scaleBand()
    .domain(d3.group(resData, (d) => d.axesXItem).keys())
    .range([marginLeft, width - marginRight])
    .padding(1);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(resData, (d) => d.viewData))
    .range([height - marginBottom, marginTop]);

  // Удаление существующих элементов
  d3.select("#chart").selectAll("g.x-axis").remove();
  d3.select("#chart").selectAll("g.x-grid").remove();
  d3.select("#chart").selectAll("g.y-grid").remove();
  d3.select("#chart").selectAll("g.y-axis").remove();
  d3.select("#chart").selectAll("g.lines").remove();
  d3.select("#chart").selectAll(".legend").remove();

  svg
    .append("g") // Добавление нового элемента, если он отсутствует
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .transition() // Добавляем анимацию для обновления
    .duration(animationDuration)
    .call(d3.axisBottom(xScale)) // Инициализируем ось X
    .selectAll("text")
    .attr("transform", "rotate(-20)")
    .style("text-anchor", "end");

  svg
    .append("g") // Добавление нового элемента, если он отсутствует
    .attr("class", "y-axis")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(yScale)) // Применяем ось Y ко всем элементам, как к новым, так и к обновленным
    .attr("transform", `translate(${marginLeft},0)`); // Обновляем положение оси
  // .transition()
  // .duration(animationDuration);

  function makeXGridlines() {
    return d3
      .axisBottom(xScale)
      .tickSize(-height + marginTop + marginBottom)
      .tickFormat("");
  }

  function makeYGridlines() {
    return d3
      .axisLeft(yScale)
      .tickSize(-width + marginLeft + marginRight)
      .tickFormat("");
  }

  // Добавление сетки оси X
  svg
    .append("g")
    .attr("class", "x-grid")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(makeXGridlines())
    .selectAll(".tick line")
    .attr("stroke-opacity", 0.1);

  // Добавление сетки оси Y
  svg
    .append("g")
    .attr("class", "y-grid")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(makeYGridlines())
    .selectAll(".tick line")
    .attr("stroke-opacity", 0.1);

  const points = resData.map((d) => [
    xScale(d.axesXItem),
    yScale(d.viewData),
    d.axesYItem,
  ]);
  const groups = d3.rollup(
    points,
    (v) => Object.assign(v, { z: v[0][2] }),
    (d) => d[2]
  );

  // отрисованные линии
  const line = d3.line();
  let path;
  let legend;
  let colors = ["red", "orange", "green", "blue", "indigo", "violet", "yellow"];
  let keys = Array.from(groups.keys()); // Преобразование Iterator в массив
  let colorsPaired = colors
    .map((color, index) => {
      return [color, keys[index]];
    })
    .filter((pair) => pair[1] !== undefined);

  // Функция, которая будет возвращать цвет для каждой линии
  let colorScale = d3
    .scaleOrdinal()
    .domain(d3.range(groups.length))
    .range(colors);

  path = svg
    .append("g")
    .attr("class", "lines")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(groups.values())
    .join("path")
    .style("mix-blend-mode", "multiply")
    .attr("d", line)
    .attr("stroke", (_, i) => colorScale(i))
    .attr("stroke-dasharray", function () {
      const length = this.getTotalLength();
      return `${length} ${length}`;
    })
    .attr("stroke-dashoffset", function () {
      const length = this.getTotalLength();
      return length;
    })
    .transition()
    .duration(animationDuration)
    .attr("stroke-dashoffset", 0);

  legend = svg
    .selectAll(".legend")
    .data(colorsPaired)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) {
      return `translate(${width - 450}, ${i * 20 + 100})`;
    });

  // Добавление прямоугольника для каждого цвета в легенде
  legend
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function (d) {
      return d[0];
    });

  // Добавление текста для каждого цвета в легенде
  legend
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(function (d) {
      return d[1];
    });

  const dot = svg.append("g").attr("display", "none");

  dot.append("circle").attr("r", 2.5);

  dot.append("text").attr("text-anchor", "middle").attr("y", -8);

  svg.on("touchstart", (event) => event.preventDefault());
};

const build_callback = () => {
  let sorters = get_sorters_data();
  let filters = get_filters_data();
  let filtered_data = Array.from(data);

  filters.forEach((filter) => {
    filtered_data = filtered_data.filter((element) => {
      if (typeof filter[0] == "object") {
        return (
          (filter[0][1] == "" ||
            new Date(element["Date"]) >= new Date(filter[0][1])) &&
          (filter[1][1] == "" ||
            new Date(element["Date"]) <= new Date(filter[1][1]))
        );
      }
      return element[filter[0]] == filter[1];
    });
  });

  filtered_data = multi_field_sort(filtered_data, sorters);
  fillTable(filtered_data);
  draw_chart(filtered_data);
};

const data = await getData();
init_sorters();
init_filters();
init_chart_settings();
fill_filters(data);
add_build_callback();
build_callback();
