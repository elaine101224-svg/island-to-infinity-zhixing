/** Chinese presentation labels; customer originals remain unchanged. */
export function merchantProductLabel(value:string):{title:string;original?:string} {
 const source=value.trim();
 if(!source)return {title:'定制需求'};
 // A Chinese description followed by an English name, e.g. the supplied Ohana design.
 const bilingual=source.match(/^(.+?[\u3400-\u9fff].*?)\s*[（(]([^（）()]+)[）)]$/);
 if(bilingual&&/[a-z]/i.test(bilingual[2])&&!/[\u3400-\u9fff]/.test(bilingual[2]))return {title:bilingual[1].trim(),original:bilingual[2].trim()};
 const known:Record<string,string>={hoodie:'连帽套头卫衣','ohana hoodie':'连帽套头卫衣','ohana house hoodie':'连帽套头卫衣','ohana house 卫衣':'连帽套头卫衣','tote bag':'手提帆布袋','cotton tote':'棉质手提袋','embroidered tote bag':'刺绣手提帆布袋',jersey:'运动球衣','t-shirt':'短袖上衣','tshirt':'短袖上衣'};
 const title=known[source.toLowerCase()];
 if(title)return {title,original:source};
 // Unknown descriptions stay intact, with a Chinese heading rather than a guessed translation.
 return /[\u3400-\u9fff]/.test(source)?{title:source}:{title:'客户定制产品',original:source};
}
