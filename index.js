import {tw, setup as setupTwind} from 'https://cdn.jsdelivr.net/npm/twind@0.16.19/+esm'
import {orderBy} from 'https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/+esm'
import {html, render} from 'https://cdn.jsdelivr.net/npm/lit-html@2.6.1/+esm'
import {repeat} from 'https://cdn.jsdelivr.net/npm/lit-html@2.6.1/directives/repeat.js'

//
;(async function () {
  setupTwind({
    preflight: false,
  })

  function formatPrice(value, maxValue) {
    const formatter = new Intl.NumberFormat(lang, {style: 'currency', currency: 'EUR'})
    return value && maxValue
      ? `${formatter.format(value)}–${formatter.format(maxValue)}`
      : value
      ? formatter.format(value)
      : ''
  }

  function mlString(...values) {
    return values[langId - 1]
  }

  const root = document.querySelector('[data-asit-rime]')

  if (!root) {
    return
  }

  const menuType = root.dataset.asitRimeType || 1
  const minisite = root.dataset.asitMinisite
  const lang = root.dataset.asitLang?.split(/_|-/)[0] || 'it'
  const access = root.dataset.asitAccess
  const langId = lang === 'it' ? 1 : lang === 'de' ? 3 : 2

  if (!access) {
    return
  }

  let data = []
  try {
    data = (
      await (
        await fetch('https://cms.asiago.it/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`,
          },
          body: JSON.stringify({
            query: /* GraphQL */ `{
    menuristocategorienolingua(
      limit: 30,
      filter: {
        menu_type: { _eq: ${menuType} }
        ${minisite ? `, customers_id: { Id: { _eq: ${minisite} } }` : ''}
      }
    ) {
      translations(filter: { Lingua: { id: { _eq: ${langId} } } }) {
        NomeCategoria
        SottotitoloCategoria
        PrenotazioneObbligatoria
        PrezzoTotale
        PrezzoTotalePersone
        TestoCondizioni
        Ordine
      }
      dishes(
        filter: {
          _or: [
            { disabled: { _eq: false } }
            { disabled: { _null: true } }
          ]
        }
      ) {
        disabled
        translations(filter: { Lingua: { id: { _eq: ${langId} } } }) {
          NomePiatto
          DescrizionePiatto
          PrezzoPiatto
          PrezzoMassimo
          Ordine
        }
      }
    }
  }`,
          }),
        })
      ).json()
    ).data.menuristocategorienolingua
  } catch (e) {
    console.error(e)
  }

  // sort categories and dishes
  data = orderBy(data, category => category.translations && category.translations[0]?.Ordine)
  data.forEach(category => {
    category.dishes = orderBy(
      category.dishes,
      dish => dish.translations && dish.translations[0]?.Ordine
    )
  })

  root.innerHTML = ''
  render(
    html`
      <div class="asit-rime ${tw`flex flex-col gap-8`}">
        ${repeat(data, category =>
          category.translations?.length
            ? html`
                <div class="asit-rime__cat ${tw`flex flex-col gap-4`}">
                  ${category.translations[0].NomeCategoria ||
                  category.translations[0].SottotitoloCategoria
                    ? html`
                        <div class="asit-rime__head">
                          <div
                            class="asit-rime-head__title ${tw`text-center text-2xl font-semibold uppercase`}"
                          >
                            ${category.translations[0].NomeCategoria}
                          </div>
                          <div class="asit-rime-head__hr ${tw`h-[1px] bg-black opacity-50`}"></div>
                          ${category.translations[0].SottotitoloCategoria
                            ? html`
                                <div
                                  class="asit-rime-head__subtitle ${tw`text-center text-xl opacity-80`}"
                                >
                                  ${category.translations[0].SottotitoloCategoria}
                                </div>
                              `
                            : ''}
                        </div>
                      `
                    : ''}
                  ${category.dishes?.length
                    ? html`
                        <div class="asit-rime__dishes ${tw`flex flex-col gap-2 flex-wrap px-4`}">
                          ${repeat(category.dishes, (dish, dishIndex) =>
                            dish.translations?.length
                              ? html`
                                  <div class="asit-rime__dish ${tw`flex flex-row gap-2`}">
                                    <div class="asit-rime-dish__info ${tw`flex-1`}">
                                      ${dish.translations[0].NomePiatto
                                        ? html`
                                            <div class="asit-rime-dish__name ${tw`text-lg`}">
                                              ${dish.translations[0].NomePiatto}
                                            </div>
                                          `
                                        : ''}
                                      ${dish.translations[0].DescrizionePiatto
                                        ? html`
                                            <div
                                              class="asit-rime-dish__desc ${tw`text-sm opacity-70`}"
                                            >
                                              ${dish.translations[0].DescrizionePiatto}
                                            </div>
                                          `
                                        : ''}
                                    </div>
                                    ${dish.translations[0].PrezzoPiatto &&
                                    !category.translations[0].PrezzoTotale
                                      ? html`
                                          <div
                                            class="asit-rime-dish__price ${tw`font-semibold pt-1`}"
                                          >
                                            ${formatPrice(
                                              dish.translations[0].PrezzoPiatto,
                                              dish.translations[0].PrezzoMassimo
                                            )}
                                          </div>
                                        `
                                      : ''}
                                  </div>
                                  ${dishIndex < category.dishes.length - 1
                                    ? html`
                                        <div
                                          class="asit-rime-dishes__hr ${tw`h-[1px] bg-black opacity-10`}"
                                        ></div>
                                      `
                                    : ''}
                                `
                              : ''
                          )}
                        </div>
                      `
                    : ''}
                  ${category.translations[0].PrezzoTotale ||
                  category.translations[0].PrenotazioneObbligatoria
                    ? html`
                        <div class="asit-rime__foot">
                          ${category.translations[0].PrezzoTotale
                            ? html`
                                <div class="asit-rime-foot__total ${tw`text-center`}">
                                  ${category.translations[0].PrezzoTotalePersone
                                    ? html`
                                        ${mlString('Totale', 'Total', 'Gesamt')}
                                        <div
                                          class="asit-rime-foot__price ${tw`inline font-semibold`}"
                                        >
                                          ${formatPrice(category.translations[0].PrezzoTotale)}
                                        </div>
                                        ${category.translations[0].PrezzoTotalePersone > 1
                                          ? mlString(
                                              `per ${category.translations[0].PrezzoTotalePersone} persone`,
                                              `for ${category.translations[0].PrezzoTotalePersone} people`,
                                              `für ${category.translations[0].PrezzoTotalePersone} Personen`
                                            )
                                          : mlString('a persona', 'per person', 'pro Person')}
                                      `
                                    : html`
                                        <div
                                          class="asit-rime-foot__price ${tw`font-semibold text-center`}"
                                        >
                                          ${formatPrice(category.translations[0].PrezzoTotale)}
                                        </div>
                                      `}
                                </div>
                              `
                            : ''}
                          ${category.translations[0].PrenotazioneObbligatoria
                            ? html`
                                <div
                                  class="asit-rime-foot__reserve ${tw`font-semibold text-center`}"
                                >
                                  ${category.translations[0].PrenotazioneObbligatoria
                                    ? mlString(
                                        'Prenotazione obbligatoria',
                                        'Reservation required',
                                        'Reservierung erforderlich'
                                      )
                                    : ''}
                                </div>
                              `
                            : ''}
                        </div>
                      `
                    : ''}
                  ${category.translations[0].TestoCondizioni
                    ? html`
                        <div class="asit-rime__notes ${tw`text-center opacity-70 text-sm`}">
                          ${category.translations[0].TestoCondizioni}
                        </div>
                      `
                    : ''}
                </div>
              `
            : ''
        )}
      </div>
    `,
    root
  )
})()
