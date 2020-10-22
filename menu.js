const menuItems = [
  { name: 'Home', html: 'index.html' },
  { name: 'Grid', html: 'grid.html' },
  { name: 'Quads', html: 'quads.html' },
  { name: 'Round', html: 'round.html' },
  { name: 'Arcs', html: 'arcs.html' },
  { name: 'Fractals', html: 'fractals.html' },
  { name: 'Dots', html: 'dots.html' },
  { name: 'Sheep', html: 'sheep.html' },
  { name: 'Leaves', html: 'leaves.html' }
]

const menuBarComponent = {
  template: `
    <div>

      <div class="d-none d-md-flex justify-content-center p-2">
        <a
          v-for="m in menuItems"
          class="text-secondary btn btn-light ml-2"
          :href="m.html"
        >
          {{m.name}}
        </a>
      </div>

      <div class="d-flex d-md-none float-right p-2">
        <button class="text-secondary btn btn-light dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          =
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <a 
            v-for="m in menuItems"
            class="text-secondary dropdown-item"
            :href="m.html"
          >
           {{m.name}}
          </a>
        </div>
      </div>

    </div>
     `,
  data: function () {return {menuItems}}
}
