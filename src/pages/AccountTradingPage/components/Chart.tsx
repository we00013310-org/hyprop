interface ChartProps {
  token: "BTC";
}

const Chart = ({ token }: ChartProps) => {
  const url = `https://app.hyperliquid.xyz/trade/${token}`;
  return (
    <div className="w-full relative h-[520px] xl:h-[668px] overflow-hidden">
      <div className="absolute w-[776px] xl:w-[1440px] h-[3000px] left-0 top-[-60px]">
        <iframe src={url} width="100%" height="100%" />
      </div>
    </div>
  );
};

export default Chart;
